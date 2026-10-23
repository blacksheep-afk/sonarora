import type { ExpectedCents } from '../money/index';
import type { DisplayPercent } from '../probability/index';
import type { EventDay } from '../scenario/index';
import type { SimulationOutcome, Strategy } from '../simulation/index';
import type { Explanation } from '../explanations/index';
export interface StrategyComparison {
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
export interface DecisionComparison {
  readonly assessment: 'modelled-not-advice';
  readonly strategies: Readonly<{ now: StrategyComparison; wait: StrategyComparison; trigger: StrategyComparison }>;
}
/** Future aggregation signature only. */
export type CompareStrategies = (outcomes: Readonly<Record<Strategy, readonly SimulationOutcome[]>>) => DecisionComparison;
