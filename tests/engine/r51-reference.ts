import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import type { ScenarioDraft } from '../../src/engine/scenario/index';
import type { SafeToBuyInput } from '../../src/engine/safe-to-buy/index';
export interface LegacyScenario {
  cash: number; bank: number; receivable: number; pPay: number; payDay: number | null; dateKnown: boolean;
  obligation: number; obligation2: number; priority: string; dueDay: number; stock: number; sales: number;
  pSales: number; salesLag: number; relation: string; emergency: number; emergencyDay: number;
}
export interface LegacyPath {
  p: number; shortfallCents: number; unpaidEssentialCents: number; unpaidEmergencyCents: number;
  unpaidPayment1Cents: number; unpaidPayment2Cents: number; endCents: number; netCents: number;
  bought: boolean; buyDay: number | null; sold: boolean;
}
export interface LegacyComparison {
  cases: LegacyPath[]; risk: number; expectedGap: number; expectedEnd: number; expectedUnpaid: number;
  expectedUnpaidPayment1: number; expectedUnpaidPayment2: number; expectedNet: number;
  buyChance: number; salesChance: number; buyTiming: { day: number | null; probability: number }[];
}
export interface Reference {
  evaluate(scenario: LegacyScenario, strategy: string): LegacyComparison;
  centsOf(text: string): number;
  expectedCents(value: number): number;
  safeToBuyPlan(scenario: LegacyScenario, settings: Record<string, unknown>): { status: string; [key: string]: unknown };
}
export function reference(): Reference {
  const html = path.resolve('reference/R51/index.html');
  assert.equal(createHash('sha256').update(readFileSync(html)).digest('hex'), 'ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d');
  const adapter = path.resolve('reference/R51/evidence/moya_r46_dom_regression.js');
  const source = readFileSync(adapter, 'utf8');
  const marker = source.indexOf('context.showChecks();');
  assert(marker > 0);
  return vm.runInNewContext(source.slice(0, marker) + '\nvm.runInContext("({ evaluate, centsOf, expectedCents, safeToBuyPlan })", context);', {
    require: createRequire(adapter), __dirname: path.dirname(adapter),
    process: { argv: ['node', 'reference', html] }, console,
  }, { timeout: 10000 }) as Reference;
}
export function legacy(draft: ScenarioDraft): LegacyScenario {
  return {
    cash: Number(draft.cash), bank: Number(draft.bank), receivable: Number(draft.receivable),
    pPay: Number(draft.probability.receipt), pSales: Number(draft.probability.sales),
    dateKnown: draft.receiptTiming.kind === 'known', payDay: draft.receiptTiming.kind === 'known' ? Number(draft.receiptTiming.day) : null,
    obligation: Number(draft.bills.find(bill => bill.id === 'bill-1')?.amount ?? 0),
    obligation2: Number(draft.bills.find(bill => bill.id === 'bill-2')?.amount ?? 0),
    priority: draft.billPriority, dueDay: Number(draft.dueDay), stock: Number(draft.stockCost), sales: Number(draft.grossSales),
    salesLag: Number(draft.salesLagDays), relation: draft.probability.relation,
    emergency: Number(draft.emergency.amount), emergencyDay: Number(draft.emergency.day),
  };
}
export function legacySafe(input: SafeToBuyInput): Record<string, unknown> {
  const status = (id: 'bill-1' | 'bill-2') => input.originalBills.find(value => value.status === 'none' ? value.billId === id : value.bill.id === id);
  const one = status('bill-1'), two = status('bill-2');
  return {
    supplierAccepted: input.supplier.splitAcceptance === 'accepted', starterCost: input.starterCost / 100,
    minimumBatch: input.supplier.minimumBatch / 100, batchStep: input.supplier.increment / 100,
    reserveBuffer: input.buffer / 100, firstDeliveryFee: input.supplier.firstDeliveryFee / 100, secondDeliveryFee: input.supplier.secondDeliveryFee / 100,
    starterSales: input.starterGrossSalesEstimate / 100, remainderSales: input.remainderGrossSalesEstimate / 100,
    receiptConfirmed: input.confirmations.receipt?.revision === input.inputRevision,
    balanceConfirmed: input.confirmations.balance?.revision === input.inputRevision,
    liabilitiesConfirmed: input.confirmations.liabilities?.revision === input.inputRevision,
    clearedAmount: (input.clearedReceipt?.amount ?? 0) / 100, clearedDay: input.clearedReceipt?.day ?? 0,
    currentFunds: (input.refreshedFunds?.clearedBalance ?? 0) / 100,
    remainingBills: (input.refreshedFunds?.remainingOtherBills ?? 0) / 100, remainingEmergency: (input.refreshedFunds?.remainingEmergency ?? 0) / 100,
    obligationStatus1: one?.status, obligationStatus2: two?.status,
    paidAmount1: one?.status === 'partial' ? one.paidAmount / 100 : 0, paidAmount2: two?.status === 'partial' ? two.paidAmount / 100 : 0,
  };
}
