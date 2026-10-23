import type { InputCents } from '../money/index';
import type { Probability } from '../probability/index';
import type { Day, FinancialScenario, ScenarioDraft } from '../scenario/index';
export const VALIDATION_CODES = [
  'MALFORMED_MONEY', 'UNSUPPORTED_PRECISION', 'NEGATIVE_MONEY', 'INPUT_MONEY_LIMIT',
  'AGGREGATE_LIMIT', 'INVALID_DAY', 'INVALID_PROBABILITY', 'INVALID_JOINT_PROBABILITY',
  'INCOMPLETE_INPUT', 'CONTRADICTORY_CONFIRMATION', 'UNSUPPORTED_SCENARIO',
] as const;
export type ValidationCode = typeof VALIDATION_CODES[number];
export interface ValidationIssue {
  readonly code: ValidationCode;
  readonly path: readonly (string | number)[];
  readonly messageKey: string;
}
export type ValidationResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; issues: readonly [ValidationIssue, ...ValidationIssue[]] }>;
export type ParseMoney = (text: string) => ValidationResult<InputCents>;
export type ParseDay = (text: string) => ValidationResult<Day>;
export type ParseProbability = (text: string) => ValidationResult<Probability>;
export type ValidateScenario = (draft: ScenarioDraft) => ValidationResult<FinancialScenario>;
