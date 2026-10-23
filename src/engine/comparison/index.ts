import type { ExpectedCents } from '../money/index';
import type { DisplayPercent } from '../probability/index';
import type { EventDay, ScenarioDraft, UserReported } from '../scenario/index';
import type { SimulationOutcome, Strategy } from '../simulation/index';
import type { Explanation } from '../explanations/index';
export interface StrategyComparison extends UserReported {
  readonly assessment: 'modelled-not-advice';
  readonly strategy: Strategy;
  readonly outcomes: readonly SimulationOutcome[];
  /** Probability of essential-bill shortfall; emergency-only unpaid is separate. */
  readonly modelledShortfallRisk: DisplayPercent;
  readonly expectedShortfall: ExpectedCents;
  readonly expectedEndBalance: ExpectedCents;
  readonly expectedUnpaid: ExpectedCents;
  readonly expectedUnpaidByBill: Readonly<Record<'bill-1' | 'bill-2', ExpectedCents>>;
  readonly expectedNetAfterUnpaid: ExpectedCents;
  readonly purchaseChance: DisplayPercent;
  readonly salesReceiptChance: DisplayPercent;
  readonly purchaseTiming: readonly Readonly<{ day: EventDay | null; percent: DisplayPercent }>[];
  readonly explanations: readonly Explanation[];
}
export interface DecisionComparison extends UserReported {
  readonly assessment: 'modelled-not-advice';
  readonly strategies: Readonly<{ now: StrategyComparison; wait: StrategyComparison; trigger: StrategyComparison }>;
}
/** Public input is a draft; all paths cross the immutable validation boundary. */
export type CompareStrategies = (draft: ScenarioDraft) => ValidationResult<DecisionComparison>;

import type { Cents } from '../money/index';
import { checkedExpected, roundExpectedCents, weightedCents, addCents, MoneyError } from '../money/index';
import { buildDistribution, displayPercent } from '../probability/index';
import type { ValidatedScenario, ValidationResult } from '../validation/index';
import { validateScenario, isValidatedScenario, deepFreeze, failure } from '../validation/index';
import { simulatePath } from '../simulation/index';
function aggregate(strategy: Strategy, outcomes: readonly SimulationOutcome[], unknownDate: boolean): StrategyComparison {
  const expected = (select: (outcome: SimulationOutcome) => Cents): ExpectedCents => {
    let total = 0;
    for (const outcome of outcomes) total = checkedExpected(total + weightedCents(select(outcome), outcome.probabilityWeight));
    return roundExpectedCents(total);
  };
  const chance = (test: (outcome: SimulationOutcome) => boolean) => displayPercent(outcomes.reduce((total, outcome) => total + (test(outcome) ? outcome.probabilityWeight : 0), 0));
  const explanations: Explanation[] = [];
  if (unknownDate) explanations.push({ code: 'UNKNOWN_RECEIPT_DATE', facts: {}, caveats: ['USER_REPORTED', 'HYPOTHETICAL', 'NOT_A_PAYMENT'] });
  if (outcomes.some(value => value.shortfall > 0)) explanations.push({ code: 'ESSENTIAL_SHORTFALL', facts: {}, caveats: ['USER_REPORTED', 'HYPOTHETICAL', 'NOT_A_PAYMENT'] });
  if (outcomes.some(value => value.unpaidEmergency > 0)) explanations.push({ code: 'EMERGENCY_SHORTFALL', facts: {}, caveats: ['USER_REPORTED', 'HYPOTHETICAL', 'NOT_A_PAYMENT'] });
  const days = [...new Set(outcomes.map(value => value.purchase.buyDay))];
  return deepFreeze({
    strategy, assessment: 'modelled-not-advice', source: 'user-reported', independentlyVerified: false, outcomes,
    modelledShortfallRisk: chance(value => value.shortfall > 0),
    expectedShortfall: expected(value => value.shortfall), expectedEndBalance: expected(value => value.endBalance),
    expectedUnpaid: expected(value => addCents(value.unpaidEssential, value.unpaidEmergency)),
    expectedUnpaidByBill: { 'bill-1': expected(value => value.unpaidByBill['bill-1']), 'bill-2': expected(value => value.unpaidByBill['bill-2']) },
    expectedNetAfterUnpaid: expected(value => value.netAfterUnpaid),
    purchaseChance: chance(value => value.purchase.bought),
    salesReceiptChance: chance(value => value.purchase.bought && value.assumedEvents.salesSucceed),
    purchaseTiming: days.map(day => ({ day, percent: chance(value => value.purchase.buyDay === day) })), explanations,
  });
}
export function compareValidatedScenario(scenario: ValidatedScenario): ValidationResult<DecisionComparison> {
  if (!isValidatedScenario(scenario)) return failure('UNSUPPORTED_SCENARIO', ['scenario']);
  const distribution = buildDistribution(scenario.probability, scenario.receipt.timing.kind === 'known');
  if (!distribution.ok) return distribution;
  try {
    const rows: StrategyComparison[] = [];
    for (const strategy of ['now', 'wait', 'trigger'] as const) {
      const outcomes: SimulationOutcome[] = [];
      for (const assumed of distribution.value.outcomes) {
        const result = simulatePath(scenario, strategy, assumed);
        if (!result.ok) return result;
        outcomes.push(result.value);
      }
      rows.push(aggregate(strategy, outcomes, distribution.value.receiptExcludedBecauseDateUnknown));
    }
    const now = rows[0], wait = rows[1], trigger = rows[2];
    if (!now || !wait || !trigger) return failure('UNSUPPORTED_SCENARIO');
    return deepFreeze({ ok: true, value: { assessment: 'modelled-not-advice', source: 'user-reported', independentlyVerified: false, strategies: { now, wait, trigger } } });
  } catch (error) {
    if (error instanceof MoneyError) return failure(error.code);
    throw error;
  }
}
export function compareScenario(draft: ScenarioDraft): ValidationResult<DecisionComparison> {
  const validation = validateScenario(draft);
  return validation.ok ? compareValidatedScenario(validation.value) : validation;
}
