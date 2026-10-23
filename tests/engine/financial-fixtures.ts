import { expect } from 'vitest';
import type { FinancialEvent, SimulationOutcome } from '../../src/engine/simulation/index';
import type { ScenarioDraft } from '../../src/engine/scenario/index';
import type { SafeToBuyInput } from '../../src/engine/safe-to-buy/index';
import { reportedReceiptDay } from '../../src/engine/safe-to-buy/index';
import { parseMoney } from '../../src/engine/money/index';
import { validateScenario } from '../../src/engine/validation/index';
import { createDecisionState } from '../../src/engine/state/index';
export function unwrap<T>(result: Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; issues: unknown }>): T {
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}
export const money = (text: string) => unwrap(parseMoney(text));
export function draft(overrides: Partial<ScenarioDraft> = {}): ScenarioDraft {
  return {
    cash: '400', bank: '200', receivable: '300', receiptTiming: { kind: 'known', day: '1' },
    bills: [{ id: 'bill-1', amount: '500' }, { id: 'bill-2', amount: '0' }],
    dueDay: '2', billPriority: 'first', stockCost: '250', grossSales: '400', salesLagDays: '2',
    emergency: { amount: '0', day: '2' }, probability: { receipt: '0.6', sales: '0.75', relation: 'independent' },
    ...overrides,
  };
}
export const validated = (overrides: Partial<ScenarioDraft> = {}) => unwrap(validateScenario(draft(overrides)));
export function safeInput(overrides: Partial<SafeToBuyInput> = {}, scenario = validated()): SafeToBuyInput {
  const revision = createDecisionState().inputRevision;
  const reported = { source: 'user-reported', independentlyVerified: false } as const;
  const claim = { ...reported, revision };
  const first = scenario.essentials.bills.find(bill => bill.id === 'bill-1');
  const second = scenario.essentials.bills.find(bill => bill.id === 'bill-2');
  return {
    scenario, inputRevision: revision,
    supplier: { ...reported, splitAcceptance: 'accepted', minimumBatch: money('100'), increment: money('50'), firstDeliveryFee: money('0'), secondDeliveryFee: money('0') },
    starterCost: money('100'), starterGrossSalesEstimate: money('160'), remainderGrossSalesEstimate: money('240'), buffer: money('0'),
    originalBills: [
      first && first.amount > 0 ? { status: 'unpaid', bill: first, outstanding: first.amount } : { status: 'none', billId: 'bill-1' },
      second && second.amount > 0 ? { status: 'unpaid', bill: second, outstanding: second.amount } : { status: 'none', billId: 'bill-2' },
    ],
    clearedReceipt: { ...reported, status: 'reported-cleared', amount: money('300'), day: unwrap(reportedReceiptDay(1)) },
    refreshedFunds: { ...reported, clearedBalance: money('650'), remainingOtherBills: money('0'), remainingEmergency: money('0') },
    confirmations: { receipt: claim, balance: claim, liabilities: claim },
    ...overrides,
  };
}

export function assertAccountingIdentity(path: SimulationOutcome) {
  let cash = BigInt(path.openingBalance);
  for (const event of path.events) {
    const posting = (entry: FinancialEvent): bigint => {
      if (entry.kind === 'receipt-cleared' || entry.kind === 'sales-received') return BigInt(entry.amount);
      if (entry.kind === 'stock-purchased') return -BigInt(entry.cost);
      if (entry.kind === 'essential-payment' || entry.kind === 'emergency-payment') return -BigInt(entry.paid);
      return 0n;
    };
    cash += posting(event);
  }
  expect(cash).toBe(BigInt(path.endBalance));
  expect(cash - BigInt(path.unpaidEssential) - BigInt(path.unpaidEmergency)).toBe(BigInt(path.netAfterUnpaid));
}
