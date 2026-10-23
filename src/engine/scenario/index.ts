import type { InputCents } from '../money/index';
import type { ProbabilityAssumptions } from '../probability/index';
declare const dayBrand: unique symbol;
declare const simulationDayBrand: unique symbol;
/** Input days are 1..14, while R51 simulates through Day 30. */
export type SimulationDay = number & { readonly [simulationDayBrand]: true };
export type Day = SimulationDay & { readonly [dayBrand]: true };
export type EventDay = 0 | SimulationDay;
export const MAX_INPUT_DAY = 14;
export const SIMULATION_HORIZON_DAYS = 30;
export type ReceiptTiming = Readonly<{ kind: 'known'; day: Day }> | Readonly<{ kind: 'unknown' }>;
export interface UserReported {
  readonly source: 'user-reported';
  readonly independentlyVerified: false;
}
export interface OpeningFunds extends UserReported {
  readonly cash: InputCents;
  readonly bank: InputCents;
}
export interface ExpectedReceipt extends UserReported {
  readonly amount: InputCents;
  readonly timing: ReceiptTiming;
  readonly status: 'expected-not-cleared';
}
export interface EssentialBill extends UserReported {
  readonly id: 'bill-1' | 'bill-2';
  readonly amount: InputCents;
}
export type EssentialBills = readonly [] | readonly [EssentialBill] | readonly [EssentialBill, EssentialBill];
export interface EssentialObligations {
  readonly bills: EssentialBills;
  readonly priority: 'first' | 'second';
  /** R51 has one shared due day, not independently dated bills. */
  readonly dueDay: Day;
}
export interface StockAndSales extends UserReported {
  readonly purchaseCost: InputCents;
  readonly estimatedGrossSales: InputCents;
  readonly salesLagDays: Day;
}
export interface EmergencyExpense extends UserReported {
  readonly amount: InputCents;
  readonly day: Day;
}
export interface FinancialScenario {
  readonly horizonDays: 30;
  readonly opening: OpeningFunds;
  readonly receipt: ExpectedReceipt;
  readonly essentials: EssentialObligations;
  readonly stock: StockAndSales;
  readonly emergency: EmergencyExpense;
  readonly probability: ProbabilityAssumptions;
}
export interface ScenarioDraft {
  readonly cash: string;
  readonly bank: string;
  readonly receivable: string;
  readonly receiptTiming: Readonly<{ kind: 'known'; day: string }> | Readonly<{ kind: 'unknown' }>;
  readonly bills: readonly Readonly<{ id: string; amount: string }>[];
  readonly dueDay: string;
  readonly billPriority: 'first' | 'second';
  readonly stockCost: string;
  readonly grossSales: string;
  readonly salesLagDays: string;
  readonly emergency: Readonly<{ amount: string; day: string }>;
  readonly probability: Readonly<{ receipt: string; sales: string; relation: string }>;
}
