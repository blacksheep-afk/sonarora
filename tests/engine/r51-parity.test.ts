import { describe, expect, it } from 'vitest';
import { compareScenario } from '../../src/engine/comparison/index';
import { planSafeToBuy } from '../../src/engine/safe-to-buy/index';
import { draft, money, safeInput, unwrap, validated, assertAccountingIdentity } from './financial-fixtures';
import { legacy, legacySafe, reference } from './r51-reference';
import type { OriginalBillState } from '../../src/engine/safe-to-buy/index';
const r51 = reference();
const scenarios = Array.from({ length: 96 }, (_, index) => draft({
  cash: ['0', '.30', '100', '400', '10000000'][index % 5]!,
  bank: (index % 3 === 0 ? '200.' : '0.') + String(index).padStart(2, '0'),
  receivable: ['0', '.15', '300', '10000000'][index % 4]!,
  receiptTiming: index % 7 === 0 ? { kind: 'unknown' } : { kind: 'known', day: String([1, 2, 14][index % 3]) },
  bills: [{ id: 'bill-1', amount: ['0', '.20', '500'][index % 3]! }, { id: 'bill-2', amount: index % 4 === 0 ? '.10' : '100' }],
  dueDay: String([1, 2, 14][(index + 1) % 3]), billPriority: index % 2 ? 'second' : 'first',
  stockCost: ['0', '.10', '100', '250'][index % 4]!, grossSales: ['0', '400', '10000000'][index % 3]!,
  salesLagDays: index % 2 ? '14' : '1', emergency: { amount: index % 3 ? '0' : '80', day: String(index % 2 ? 1 : 14) },
  probability: { receipt: ['0', '.1234', '.6', '1'][index % 4]!, sales: ['0', '.29', '.75', '1'][(index + 1) % 4]!, relation: index % 2 ? 'linked' : 'independent' },
}));
if (new Set(scenarios.map(value => JSON.stringify(value))).size !== 96) throw new Error('Comparison parity fixtures must be distinct');
describe('R51 parity and independent accounting invariants', () => {
  it.each(scenarios.map((input, index) => ({ input, index })))('matches all three strategies for scenario $index', ({ input }) => {
    const fresh = unwrap(compareScenario(input));
    for (const strategy of ['now', 'wait', 'trigger'] as const) {
      const actual = fresh.strategies[strategy], expected = r51.evaluate(legacy(input), strategy);
      expect(actual.modelledShortfallRisk).toBe(expected.risk);
      expect(actual.purchaseChance).toBe(expected.buyChance);
      expect(actual.salesReceiptChance).toBe(expected.salesChance);
      const fields = [
        [actual.expectedShortfall, expected.expectedGap], [actual.expectedEndBalance, expected.expectedEnd],
        [actual.expectedUnpaid, expected.expectedUnpaid], [actual.expectedNetAfterUnpaid, expected.expectedNet],
        [actual.expectedUnpaidByBill['bill-1'], expected.expectedUnpaidPayment1],
        [actual.expectedUnpaidByBill['bill-2'], expected.expectedUnpaidPayment2],
      ];
      for (const [cents, rand] of fields) expect(cents).toBe(Math.round(rand! * 100));
      expect(actual.purchaseTiming.map(value => ({ day: value.day, probability: value.percent }))).toEqual(expected.buyTiming);
      expect(actual.outcomes).toHaveLength(expected.cases.length);
      actual.outcomes.forEach((path, index) => {
        const old = expected.cases[index]!;
        expect([path.endBalance, path.netAfterUnpaid, path.shortfall, path.unpaidEssential, path.unpaidEmergency, path.unpaidByBill['bill-1'], path.unpaidByBill['bill-2']])
          .toEqual([old.endCents, old.netCents, old.shortfallCents, old.unpaidEssentialCents, old.unpaidEmergencyCents, old.unpaidPayment1Cents, old.unpaidPayment2Cents]);
        expect(path.probabilityWeight).toBe(old.p);
        expect(path.purchase.bought).toBe(old.bought);
        expect(path.purchase.buyDay).toBe(old.buyDay);
        assertAccountingIdentity(path);
      });
    }
  });
});
describe('Safe-to-Buy parity on matching valid inputs', () => {
  const cases = Array.from({ length: 40 }, (_, index) => {
    const scenario = validated();
    const original = scenario.essentials.bills[0]!;
    const status = ['unpaid', 'partial', 'paid', 'unresolved'][index % 4]!;
    const bill: OriginalBillState = status === 'partial'
      ? { status: 'partial', bill: original, paidAmount: money('300'), outstanding: money('200') }
      : status === 'unpaid' ? { status: 'unpaid', bill: original, outstanding: original.amount }
      : status === 'paid' ? { status: 'paid', bill: original, outstanding: money('0') }
      : { status: 'unresolved', bill: original };
    const input = safeInput({
      originalBills: [bill, { status: 'none', billId: 'bill-2' }],
      refreshedFunds: { source: 'user-reported', independentlyVerified: false, clearedBalance: money(['149.99', '150', '349.99', '350', '649.99', '650', '1000'][index % 7]!), remainingOtherBills: money(index % 6 === 0 ? '100' : '0'), remainingEmergency: money('0.' + String(index).padStart(2, '0')) },
    }, scenario);
    if (index % 9 === 0) return { index, input: { ...input, supplier: { ...input.supplier, splitAcceptance: 'not-accepted' as const } } };
    if (index % 8 === 0) return { index, input: { ...input, supplier: { ...input.supplier, firstDeliveryFee: money('1') } } };
    return { index, input };
  });
  if (new Set(cases.map(value => JSON.stringify(value.input))).size !== 40) throw new Error('Safe parity fixtures must be distinct');
  it.each(cases)('matches status, reserves, sales estimates and later locking for case $index', ({ input }) => {
    const old = r51.safeToBuyPlan(legacy(draft()), legacySafe(input));
    const fresh = unwrap(planSafeToBuy(input));
    expect(fresh.status).toBe(old.status === 'feasible' ? 'modelled-feasible' : 'blocked');
    if (old.status === 'feasible') {
      const detail = fresh.diagnostics!;
      const fields = [
        [detail.reserve, old.reserve], [detail.availableNow, old.safeNow], [detail.starterSpend, old.firstSpend],
        [detail.firstBalance, old.firstBalance], [detail.remainder, old.remainder],
        [detail.starterExpectedSurplus, old.firstExpected], [detail.remainderExpectedSurplus, old.secondExpected],
        [detail.remainingReserve, old.remainingReserve], [detail.currentFunds, old.currentFunds],
        [detail.availableForRemainder, old.safeForRemainder], [detail.remainderSpend, old.secondSpend],
      ] as const;
      for (const [cents, rand] of fields) expect(cents).toBe(Math.round(Number(rand) * 100));
      expect(detail.receiptConfirmed).toBe(old.receiptConfirmed);
      expect(detail.liabilitiesResolved).toBe(old.liabilitiesResolved);
      expect(detail.secondUnlocked).toBe(old.secondUnlocked);
    }
  });
});
