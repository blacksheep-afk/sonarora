import type { Cents } from '../money/index';
import type { Probability } from '../probability/index';
export const REASON_CODES = [
  'EXPECTED_RECEIPT_NOT_CLEARED', 'UNKNOWN_RECEIPT_DATE', 'ESSENTIAL_SHORTFALL',
  'EMERGENCY_SHORTFALL', 'PURCHASE_NOT_EXECUTED', 'SUPPLIER_SPLIT_NOT_ACCEPTED',
  'SUPPLIER_MINIMUM', 'SUPPLIER_INCREMENT', 'INSUFFICIENT_CLEARED_FUNDS',
  'UNRESOLVED_LIABILITY', 'CONFIRMATION_REQUIRED', 'STALE_INPUT',
  'SALES_ESTIMATE_INSUFFICIENT', 'MODELLED_FEASIBLE', 'OUTSIDE_HORIZON', 'INVALID_ORDER',
] as const;
export type ReasonCode = typeof REASON_CODES[number];
export type ExplanationFact =
  | Readonly<{ kind: 'money'; cents: Cents }>
  | Readonly<{ kind: 'probability'; value: Probability }>
  | Readonly<{ kind: 'day'; value: number }>
  | Readonly<{ kind: 'label'; value: string }>;
export interface Explanation {
  readonly code: ReasonCode;
  readonly facts: Readonly<Record<string, ExplanationFact>>;
  readonly caveats: readonly ('USER_REPORTED' | 'HYPOTHETICAL' | 'SALES_SURPLUS_NOT_PROFIT' | 'NOT_A_PAYMENT')[];
}
export interface ExplanationDisplayContract {
  readonly explanation: Explanation;
  readonly messageKey: string;
  readonly assessment: 'modelled';
}
