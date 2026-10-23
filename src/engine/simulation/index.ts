import type { Cents, NonNegativeCents } from '../money/index';
import type { Probability, JointOutcome } from '../probability/index';
import type { Day, SimulationDay, EventDay, EssentialBill, UserReported } from '../scenario/index';
export const STRATEGY_LABELS = {
  now: 'Buy now',
  wait: 'Protect the bill first',
  trigger: 'Purchase conditionally after receipt',
} as const;
export type Strategy = keyof typeof STRATEGY_LABELS;
export type FinancialEvent =
  | Readonly<{ kind: 'horizon-closed'; day: SimulationDay; balance: NonNegativeCents }>

  | Readonly<{ kind: 'purchase-not-executed'; day: EventDay; available: NonNegativeCents; required: NonNegativeCents }>
  | Readonly<{ kind: 'receipt-cleared'; day: Day; amount: NonNegativeCents }>
  | Readonly<{ kind: 'essential-payment'; day: Day; billId: EssentialBill['id']; due: NonNegativeCents; paid: NonNegativeCents; unpaid: NonNegativeCents }>
  | Readonly<{ kind: 'emergency-payment'; day: Day; due: NonNegativeCents; paid: NonNegativeCents; unpaid: NonNegativeCents }>
  | Readonly<{ kind: 'stock-purchased'; day: EventDay; cost: NonNegativeCents }>
  | Readonly<{ kind: 'sales-received'; day: SimulationDay; amount: NonNegativeCents }>;
export type PurchaseOutcome =
  | Readonly<{ bought: false; buyDay: null; salesReceivedDay: null }>
  | Readonly<{ bought: true; buyDay: EventDay; salesReceivedDay: SimulationDay | null }>;
export interface SimulationOutcome extends UserReported {
  readonly assessment: 'modelled-not-advice';
  readonly closingDay: 30;
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
export type SimulatePath = (scenario: ValidatedScenario, strategy: Strategy, events: JointOutcome) => ValidationResult<SimulationOutcome>;

import { checkedCents, nonNegativeCents, addCents, subtractCents, sumCents, MoneyError } from '../money/index';
import { buildDistribution } from '../probability/index';
import type { ValidatedScenario, ValidationResult } from '../validation/index';
import { isValidatedScenario, failure, deepFreeze } from '../validation/index';
export function simulationDay(value: number): SimulationDay {
  if (!Number.isInteger(value) || value < 1 || value > 30) throw new RangeError('INVALID_DAY');
  return value as SimulationDay;
}
export function simulatePath(scenario: ValidatedScenario, strategy: Strategy, assumption: JointOutcome): ValidationResult<SimulationOutcome> {
  if (!isValidatedScenario(scenario)) return failure('UNSUPPORTED_SCENARIO', ['scenario']);
  if (!['now', 'wait', 'trigger'].includes(strategy)) return failure('UNSUPPORTED_SCENARIO', ['strategy']);
  const distribution = buildDistribution(scenario.probability, scenario.receipt.timing.kind === 'known');
  if (!distribution.ok) return distribution;
  if (!assumption || !distribution.value.outcomes.some(value => value.receiptArrives === assumption.receiptArrives && value.salesSucceed === assumption.salesSucceed && value.weight === assumption.weight)) return failure('INVALID_JOINT_PROBABILITY');
  try {
    const zero = nonNegativeCents(0);
    const opening = nonNegativeCents(addCents(scenario.opening.cash, scenario.opening.bank));
    let balance = opening, unpaidEssential = zero, unpaidEmergency = zero;
    const unpaidByBill: Record<EssentialBill['id'], NonNegativeCents> = { 'bill-1': zero, 'bill-2': zero };
    const amounts: Record<EssentialBill['id'], NonNegativeCents> = { 'bill-1': zero, 'bill-2': zero };
    for (const bill of scenario.essentials.bills) amounts[bill.id] = bill.amount;
    const stock = scenario.stock.purchaseCost;
    const events: FinancialEvent[] = [];
    let bought = false;
    let buyDay: EventDay | null = null;
    let scheduledSalesDay: number | null = null;
    let salesReceivedDay: SimulationDay | null = null;
    function purchase(day: EventDay) {
      balance = nonNegativeCents(subtractCents(balance, stock));
      bought = true; buyDay = day; scheduledSalesDay = day + scenario.stock.salesLagDays;
      events.push({ kind: 'stock-purchased', day, cost: stock });
    }
    function missedPurchase(day: EventDay, required: NonNegativeCents) {
      events.push({ kind: 'purchase-not-executed', day, available: balance, required });
    }
    if (strategy === 'now' && stock > 0) {
      if (stock <= balance) purchase(0); else missedPurchase(0, stock);
    }
    for (let numericDay = 1; numericDay <= 30; numericDay++) {
      const day = simulationDay(numericDay);
      if (assumption.receiptArrives && scenario.receipt.timing.kind === 'known' && scenario.receipt.amount > 0 && numericDay === scenario.receipt.timing.day) {
        balance = nonNegativeCents(addCents(balance, scenario.receipt.amount));
        events.push({ kind: 'receipt-cleared', day: scenario.receipt.timing.day, amount: scenario.receipt.amount });
      }
      if (numericDay === scenario.essentials.dueDay) {
        const ids: readonly EssentialBill['id'][] = scenario.essentials.priority === 'second' ? ['bill-2', 'bill-1'] : ['bill-1', 'bill-2'];
        for (const id of ids) {
          const amount = amounts[id], paid = nonNegativeCents(Math.min(balance, amount));
          const unpaid = nonNegativeCents(subtractCents(amount, paid));
          balance = nonNegativeCents(subtractCents(balance, paid));
          unpaidEssential = nonNegativeCents(addCents(unpaidEssential, unpaid));
          unpaidByBill[id] = unpaid;
          events.push({ kind: 'essential-payment', day: scenario.essentials.dueDay, billId: id, due: amount, paid, unpaid });
        }
      }
      if (scenario.emergency.amount > 0 && numericDay === scenario.emergency.day) {
        const paid = nonNegativeCents(Math.min(balance, scenario.emergency.amount));
        balance = nonNegativeCents(subtractCents(balance, paid));
        unpaidEmergency = nonNegativeCents(subtractCents(scenario.emergency.amount, paid));
        events.push({ kind: 'emergency-payment', day: scenario.emergency.day, due: scenario.emergency.amount, paid, unpaid: unpaidEmergency });
      }
      if (strategy === 'wait' && numericDay === scenario.essentials.dueDay + 1 && stock > 0) {
        if (balance >= stock) purchase(day); else missedPurchase(day, stock);
      }
      if (strategy === 'trigger' && stock > 0 && assumption.receiptArrives && scenario.receipt.timing.kind === 'known' && scenario.receipt.amount > 0 && numericDay === scenario.receipt.timing.day && !bought && unpaidEssential === 0 && unpaidEmergency === 0) {
        const reserve = sumCents([
          numericDay < scenario.essentials.dueDay ? sumCents([amounts['bill-1'], amounts['bill-2']]) : checkedCents(0),
          numericDay < scenario.emergency.day ? scenario.emergency.amount : checkedCents(0),
        ]);
        const required = nonNegativeCents(addCents(stock, reserve));
        if (balance >= required) purchase(day); else missedPurchase(day, required);
      }
      if (bought && assumption.salesSucceed && numericDay === scheduledSalesDay) {
        balance = nonNegativeCents(addCents(balance, scenario.stock.estimatedGrossSales));
        salesReceivedDay = day;
        events.push({ kind: 'sales-received', day, amount: scenario.stock.estimatedGrossSales });
      }
    }
    const purchaseResult: PurchaseOutcome = buyDay !== null
      ? { bought: true, buyDay, salesReceivedDay }
      : { bought: false, buyDay: null, salesReceivedDay: null };
    events.push({ kind: 'horizon-closed', day: simulationDay(30), balance });
    return deepFreeze({ ok: true, value: {
      strategy, source: 'user-reported', independentlyVerified: false, assessment: 'modelled-not-advice', closingDay: 30,
      assumedEvents: { receiptArrives: assumption.receiptArrives, salesSucceed: assumption.salesSucceed },
      probabilityWeight: assumption.weight, purchase: purchaseResult,
      openingBalance: opening, endBalance: balance,
      netAfterUnpaid: subtractCents(subtractCents(balance, unpaidEssential), unpaidEmergency),
      shortfall: unpaidEssential, unpaidEssential, unpaidEmergency, unpaidByBill, events,
    } });
  } catch (error) {
    if (error instanceof MoneyError) return failure(error.code);
    throw error;
  }
}
