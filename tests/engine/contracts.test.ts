import { describe, expect, expectTypeOf, it } from 'vitest';
import { MAX_INPUT_CENTS, MAX_AGGREGATE_CENTS } from '../../src/engine/money/index';
import type { Cents, InputCents, ExpectedCents } from '../../src/engine/money/index';
import type { Probability } from '../../src/engine/probability/index';
import type { Day, FinancialScenario } from '../../src/engine/scenario/index';
import type { OriginalBillState, SafeToBuyPlan, ReportedClearedReceipt } from '../../src/engine/safe-to-buy/index';
import type { ValidationResult, ValidationIssue } from '../../src/engine/validation/index';
import { STRATEGY_LABELS } from '../../src/engine/simulation/index';
import type { Strategy, PurchaseOutcome } from '../../src/engine/simulation/index';
import type { DecisionComparison } from '../../src/engine/comparison/index';
import type { UserAttestation } from '../../src/engine/state/index';
import { REASON_CODES } from '../../src/engine/explanations/index';
import type { Explanation } from '../../src/engine/explanations/index';

// Casts below are synthetic type fixtures, never validation or a financial oracle.
const input = 100 as InputCents;
const probability = 0.5 as Probability;
const day = 1 as Day;
const reported = { source: 'user-reported', independentlyVerified: false } as const;
const scenario = {
  horizonDays: 30,
  opening: { ...reported, cash: input, bank: input },
  receipt: { ...reported, amount: input, timing: { kind: 'unknown' }, status: 'expected-not-cleared' },
  essentials: { bills: [{ ...reported, id: 'bill-1', amount: input }, { ...reported, id: 'bill-2', amount: input }], dueDay: day, priority: 'first' },
  stock: { ...reported, purchaseCost: input, estimatedGrossSales: input, salesLagDays: day },
  emergency: { ...reported, amount: input, day },
  probability: { kind: 'linked', receipt: probability, sales: probability, jointRule: 'minimum-marginal' },
} as const satisfies FinancialScenario;

describe('typed contract shapes (no financial calculations)', () => {
  it('records R51 limits in cents and preserves strategy keys', () => {
    expect(MAX_INPUT_CENTS).toBe(1_000_000_000);
    expect(MAX_AGGREGATE_CENTS).toBe(100_000_000_000);
    expect(Object.keys(STRATEGY_LABELS)).toEqual(['now', 'wait', 'trigger']);
    expect(scenario.probability.jointRule).toBe('minimum-marginal');
    expect(scenario.horizonDays).toBe(30);
    expect(scenario.essentials.priority).toBe('first');
  });
  it('represents unknown dates without fictitious arrival days and keeps two bills', () => {
    expect(scenario.receipt.timing).toEqual({ kind: 'unknown' });
    expect(scenario.essentials.bills).toHaveLength(2);
  });
  it('separates unresolved and partially reconciled liabilities', () => {
    const states: readonly OriginalBillState[] = [
      { status: 'none', billId: 'bill-2' },
      { status: 'unresolved', bill: scenario.essentials.bills[0] },
      { status: 'unpaid', bill: scenario.essentials.bills[0], outstanding: input },
      { status: 'partial', bill: { ...scenario.essentials.bills[0], amount: 300 as InputCents }, paidAmount: input, outstanding: 200 as InputCents },
      { status: 'paid', bill: scenario.essentials.bills[0], outstanding: 0 as InputCents },
    ];
    // Shape fixtures do not execute or validate financial reconciliation.
    expect(states.map(value => value.status)).toEqual(['none', 'unresolved', 'unpaid', 'partial', 'paid']);
  });
  it('keeps errors structured and failed validation free of a normalized value', () => {
    const issue: ValidationIssue = { code: 'UNSUPPORTED_PRECISION', path: ['cash'], messageKey: 'money.precision' };
    const result: ValidationResult<FinancialScenario> = { ok: false, issues: [issue] };
    expect(result.issues[0].path).toEqual(['cash']);
    expect(result).not.toHaveProperty('value');
  });
  it('has explicit incomplete, blocked, locked and modelled feasibility boundaries', () => {
    expectTypeOf<SafeToBuyPlan['status']>().toEqualTypeOf<'incomplete' | 'blocked' | 'locked' | 'modelled-feasible'>();
    expectTypeOf<Strategy>().toEqualTypeOf<'now' | 'wait' | 'trigger'>();
    expectTypeOf<keyof DecisionComparison['strategies']>().toEqualTypeOf<Strategy>();
    expectTypeOf<InputCents>().toExtend<Cents>();
    expectTypeOf<Probability>().not.toExtend<Cents>();
    expectTypeOf<ExpectedCents>().not.toExtend<InputCents>();
    expectTypeOf<UserAttestation['independentlyVerified']>().toEqualTypeOf<false>();
    expectTypeOf<ReportedClearedReceipt['source']>().toEqualTypeOf<'user-reported'>();
  });
  it('separates typed explanation facts from React messages', () => {
    const explanation: Explanation = { code: 'UNKNOWN_RECEIPT_DATE', facts: {}, caveats: ['USER_REPORTED'] };
    expect(REASON_CODES).toContain(explanation.code);
  });
});

// Compiled but never executed: intentional type errors MUST stay errors.
function compileOnlyContracts(value: FinancialScenario, claim: UserAttestation, validation: ValidationResult<FinancialScenario>) {
  // @ts-expect-error ordinary numbers are not validated integer cents
  const cents: Cents = 1.25;
  // @ts-expect-error probabilities are not monetary amounts
  const wrongMoney: Cents = probability;
  // @ts-expect-error financial records are immutable
  value.opening.cash = input;
  // @ts-expect-error bills are immutable
  value.essentials.bills.push(value.essentials.bills[0]);
  // @ts-expect-error user attestation cannot claim independent verification
  const bankClaim: UserAttestation = { ...claim, independentlyVerified: true };
  // @ts-expect-error unknown receipt dates must not carry a made-up day
  const timing: FinancialScenario['receipt']['timing'] = { kind: 'unknown', day };
  // @ts-expect-error no purchase means there cannot be a purchase day
  const purchase: PurchaseOutcome = { bought: false, buyDay: day, salesReceivedDay: null };
  if (!validation.ok) {
    // @ts-expect-error failed validation cannot expose old normalized data
    const invalidValue = validation.value;
    void invalidValue;
  }
  // @ts-expect-error not a supported R51 strategy
  const unsupported: Strategy = 'borrow';
  // @ts-expect-error R51 simulation horizon is 30, not the input-day limit
  const wrongHorizon: FinancialScenario['horizonDays'] = 14;
  // @ts-expect-error failure issues must not be empty
  const emptyFailure: ValidationResult<FinancialScenario> = { ok: false, issues: [] };
  void [cents, wrongMoney, bankClaim, timing, purchase, unsupported, wrongHorizon, emptyFailure];
}
void compileOnlyContracts;
