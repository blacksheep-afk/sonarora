import { describe, expect, it } from 'vitest';
import { planSafeToBuy, reportedReceiptDay } from '../../src/engine/safe-to-buy/index';
import type { SafeToBuyInput } from '../../src/engine/safe-to-buy/index';
import { createDecisionState, financialInputChanged } from '../../src/engine/state/index';
import { money, safeInput, unwrap, validated } from './financial-fixtures';
function unlocked(input: SafeToBuyInput): boolean {
  const plan = unwrap(planSafeToBuy(input));
  return plan.status === 'modelled-feasible' && plan.later.status === 'modelled-feasible';
}
describe('independent Safe-to-Buy expectations and boundaries', () => {
  it('derives R500 reserve, R100 starter, R150 remainder and R20/R30 sales surpluses', () => {
    const result = unwrap(planSafeToBuy(safeInput()));
    expect(result.status).toBe('modelled-feasible');
    expect(result.diagnostics).toMatchObject({
      reserve: 50000, availableNow: 10000, starterSpend: 10000, firstBalance: 50000,
      remainder: 15000, starterExpectedSurplus: 2000, remainderExpectedSurplus: 3000,
      remainingReserve: 50000, currentFunds: 65000, availableForRemainder: 15000, remainderSpend: 15000, secondUnlocked: true,
    });
  });
  it.each(['349.99', '350'])('protects R200 after a R300 partial payment with refreshed funds %s', funds => {
    const scenario = validated(), bill = scenario.essentials.bills[0]!;
    const input = safeInput({ originalBills: [{ status: 'partial', bill, paidAmount: money('300'), outstanding: money('200') }, { status: 'none', billId: 'bill-2' }] }, scenario);
    const result = planSafeToBuy({ ...input, refreshedFunds: { ...input.refreshedFunds!, clearedBalance: money(funds) } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.diagnostics?.secondUnlocked).toBe(funds === '350');
  });
  it('uses zero reserve for a paid bill and full reserve for unpaid', () => {
    const scenario = validated(), bill = scenario.essentials.bills[0]!;
    const paid = safeInput({ originalBills: [{ status: 'paid', bill, outstanding: money('0') }, { status: 'none', billId: 'bill-2' }] }, scenario);
    expect(unlocked({ ...paid, refreshedFunds: { ...paid.refreshedFunds!, clearedBalance: money('150') } })).toBe(true);
    const unpaid = safeInput();
    expect(unlocked({ ...unpaid, refreshedFunds: { ...unpaid.refreshedFunds!, clearedBalance: money('649.99') } })).toBe(false);
  });
  it('never adds cleared receipt to a refreshed balance a second time', () => {
    const input = safeInput();
    const result = unwrap(planSafeToBuy({ ...input, refreshedFunds: { ...input.refreshedFunds!, clearedBalance: money('350') } }));
    expect(result.diagnostics?.currentFunds).toBe(35000);
    expect(result.diagnostics?.availableForRemainder).toBe(-15000);
    expect(result.diagnostics?.secondUnlocked).toBe(false);
  });
  it('keeps unresolved liabilities locked despite ample reported funds and confirmations', () => {
    const scenario = validated(), bill = scenario.essentials.bills[0]!;
    const input = safeInput({ originalBills: [{ status: 'unresolved', bill }, { status: 'none', billId: 'bill-2' }] }, scenario);
    expect(unlocked(input)).toBe(false);
  });
  it('invalidates stale confirmations and never upgrades user attestations to bank verification', () => {
    const input = safeInput();
    const revised = financialInputChanged(createDecisionState()).inputRevision;
    const result = unwrap(planSafeToBuy({ ...input, inputRevision: revised }));
    expect(result.status).toBe('modelled-feasible');
    if (result.status === 'modelled-feasible') {
      expect(result.later.status).toBe('locked');
      if (result.later.status === 'locked') expect(result.later.explanations.some(value => value.code === 'STALE_INPUT')).toBe(true);
    }
    expect(result.independentlyVerified).toBe(false);
    expect(planSafeToBuy({ ...input, confirmations: { ...input.confirmations, receipt: { ...input.confirmations.receipt!, independentlyVerified: true } } } as never).ok).toBe(false);
  });
  it.each([
    ['paid-with-outstanding', 'paid', '0', '1'],
    ['paid-with-partial-amount', 'paid', '1', '0'],
    ['unpaid-with-zero-outstanding', 'unpaid', '0', '0'],
    ['partial-full-payment', 'partial', '500', '0'],
    ['partial-mismatched-remainder', 'partial', '300', '199.99'],
  ])('rejects contradictory reconciliation %s', (_name, status, paid, outstanding) => {
    const scenario = validated(), bill = scenario.essentials.bills[0]!;
    const input = safeInput({ originalBills: [{ status, bill, paidAmount: money(paid!), outstanding: money(outstanding!) }, { status: 'none', billId: 'bill-2' }] as never }, scenario);
    const result = planSafeToBuy(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(value => value.code === 'CONTRADICTORY_CONFIRMATION')).toBe(true);
  });
  it.each(['supplier', 'minimum', 'increment', 'fee', 'buffer', 'sales'] as const)('blocks the %s constraint', change => {
    const input = safeInput();
    const changed: SafeToBuyInput = change === 'supplier' ? { ...input, supplier: { ...input.supplier, splitAcceptance: 'not-accepted' } }
      : change === 'minimum' ? { ...input, supplier: { ...input.supplier, minimumBatch: money('200') } }
      : change === 'increment' ? { ...input, supplier: { ...input.supplier, increment: money('100') } }
      : change === 'fee' ? { ...input, supplier: { ...input.supplier, firstDeliveryFee: money('.01') } }
      : change === 'buffer' ? { ...input, buffer: money('.01') }
      : { ...input, starterGrossSalesEstimate: money('100') };
    const result = unwrap(planSafeToBuy(changed));
    expect(result.status).toBe('blocked');
    expect(result.diagnostics?.secondUnlocked ?? false).toBe(false);
  });
  it('accepts actual cleared Day 0 but locks late Day 3/30 without expanding scenario day inputs', () => {
    for (const day of [0, 3, 30]) {
      const input = safeInput();
      expect(unlocked({ ...input, clearedReceipt: { ...input.clearedReceipt!, day: unwrap(reportedReceiptDay(day)) } })).toBe(day === 0);
    }
    expect(reportedReceiptDay(-1).ok).toBe(false);
    expect(reportedReceiptDay(.5).ok).toBe(false);
    expect(reportedReceiptDay(Infinity).ok).toBe(false);
  });
  it('rejects missing snapshots with current confirmations and malformed cent input', () => {
    const input = safeInput();
    expect(planSafeToBuy({ ...input, clearedReceipt: null }).ok).toBe(false);
    expect(planSafeToBuy({ ...input, refreshedFunds: null }).ok).toBe(false);
    expect(planSafeToBuy({ ...input, starterCost: 0.001 } as never).ok).toBe(false);
  });
});

it('rejects a no-bill slot carrying a paid or outstanding amount', () => {
  const input = safeInput();
  for (const extra of [{ paidAmount: money('1') }, { outstanding: money('1') }]) {
    expect(planSafeToBuy({ ...input, originalBills: [input.originalBills[0], { status: 'none', billId: 'bill-2', ...extra }] } as never).ok).toBe(false);
  }
});
