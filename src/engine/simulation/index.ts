import type { Cents, NonNegativeCents } from '../money/index';
import type { Probability, JointOutcome } from '../probability/index';
import type { Day, SimulationDay, EventDay, FinancialScenario, EssentialBill } from '../scenario/index';
export const STRATEGY_LABELS = {
  now: 'Buy now',
  wait: 'Protect the bill first',
  trigger: 'Purchase conditionally after receipt',
} as const;
export type Strategy = keyof typeof STRATEGY_LABELS;
export type FinancialEvent =
  | Readonly<{ kind: 'purchase-not-executed'; day: EventDay; available: NonNegativeCents; required: NonNegativeCents }>
  | Readonly<{ kind: 'receipt-cleared'; day: Day; amount: NonNegativeCents }>
  | Readonly<{ kind: 'essential-payment'; day: Day; billId: EssentialBill['id']; due: NonNegativeCents; paid: NonNegativeCents; unpaid: NonNegativeCents }>
  | Readonly<{ kind: 'emergency-payment'; day: Day; due: NonNegativeCents; paid: NonNegativeCents; unpaid: NonNegativeCents }>
  | Readonly<{ kind: 'stock-purchased'; day: EventDay; cost: NonNegativeCents }>
  | Readonly<{ kind: 'sales-received'; day: SimulationDay; amount: NonNegativeCents }>;
export type PurchaseOutcome =
  | Readonly<{ bought: false; buyDay: null; salesReceivedDay: null }>
  | Readonly<{ bought: true; buyDay: EventDay; salesReceivedDay: SimulationDay | null }>;
export interface SimulationOutcome {
  readonly strategy: Strategy;
  readonly assumedEvents: Omit<JointOutcome, 'weight'>;
  readonly probabilityWeight: Probability;
  readonly purchase: PurchaseOutcome;
  readonly openingBalance: NonNegativeCents;
  readonly endBalance: NonNegativeCents;
  readonly netAfterUnpaid: Cents;
  /** R51 shortfall/risk counts essential bills; emergency unpaid is separate. */
  readonly shortfall: NonNegativeCents;
  readonly unpaidEssential: NonNegativeCents;
  readonly unpaidEmergency: NonNegativeCents;
  readonly unpaidByBill: Readonly<Record<EssentialBill['id'], NonNegativeCents>>;
  readonly events: readonly FinancialEvent[];
}
export type SimulatePath = (scenario: FinancialScenario, strategy: Strategy, events: JointOutcome) => SimulationOutcome;
