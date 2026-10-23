import type { InputCents } from '../money/index';
import { parseMoney, sumCents, MoneyError } from '../money/index';
import type { Probability, ProbabilityAssumptions } from '../probability/index';
import { parseProbability as parseProbabilityValue } from '../probability/index';
import type { Day, FinancialScenario, ScenarioDraft, EssentialBill, EssentialBills, ReceiptTiming } from '../scenario/index';
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
export type ValidateScenario = (draft: ScenarioDraft) => ValidationResult<ValidatedScenario>;

declare const scenarioBrand: unique symbol;
export type ValidatedScenario = FinancialScenario & { readonly [scenarioBrand]: true };
const registeredScenarios = new WeakSet<object>();
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export function failure<T>(code: ValidationCode, path: readonly (string | number)[] = []): ValidationResult<T> {
  return deepFreeze({ ok: false, issues: [{ code, path: [...path], messageKey: 'validation.' + code }] });
}
export function isValidatedScenario(value: unknown): value is ValidatedScenario {
  return value !== null && typeof value === 'object' && registeredScenarios.has(value);
}
export function parseDay(text: string): ValidationResult<Day> {
  if (typeof text !== 'string' || text.trim() === '') return failure('INVALID_DAY');
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= 14 ? deepFreeze({ ok: true, value: value as Day }) : failure('INVALID_DAY');
}
export function validateScenario(draft: ScenarioDraft): ValidationResult<ValidatedScenario> {
  const issues: ValidationIssue[] = [];
  const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const source = object(draft);
  const issue = (code: ValidationCode, path: readonly (string | number)[]) => { issues.push({ code, path, messageKey: 'validation.' + code }); };
  const money = (value: unknown, path: readonly (string | number)[]): InputCents => {
    if (typeof value !== 'string' || value.trim() === '') { issue('INCOMPLETE_INPUT', path); return 0 as InputCents; }
    const result = parseMoney(value);
    if (result.ok) return result.value;
    issue(result.issues[0].code, path); return 0 as InputCents;
  };
  const day = (value: unknown, path: readonly (string | number)[]): Day => {
    const result = parseDay(typeof value === 'string' ? value : '');
    if (result.ok) return result.value;
    issue('INVALID_DAY', path); return 1 as Day;
  };
  const probability = (value: unknown, path: readonly (string | number)[]): Probability => {
    const result = parseProbabilityValue(typeof value === 'string' ? value : '');
    if (result.ok) return result.value;
    issue('INVALID_PROBABILITY', path); return 0 as Probability;
  };
  const cash = money(source.cash, ['cash']), bank = money(source.bank, ['bank']), receiptAmount = money(source.receivable, ['receivable']);
  const timingInput = object(source.receiptTiming);
  let timing: ReceiptTiming = { kind: 'unknown' };
  if (timingInput.kind === 'known') timing = { kind: 'known', day: day(timingInput.day, ['receiptTiming', 'day']) };
  else if (timingInput.kind !== 'unknown') issue('INCOMPLETE_INPUT', ['receiptTiming']);
  else if ('day' in timingInput) issue('UNSUPPORTED_SCENARIO', ['receiptTiming', 'day']);
  const billInputs: unknown[] = Array.isArray(source.bills) ? source.bills : [];
  if (!Array.isArray(source.bills)) issue('INCOMPLETE_INPUT', ['bills']);
  if (billInputs.length > 2) issue('UNSUPPORTED_SCENARIO', ['bills']);
  const seen = new Set<string>();
  const bills: EssentialBill[] = [];
  for (const [index, raw] of billInputs.slice(0, 3).entries()) {
    const bill = object(raw);
    if ('dueDay' in bill) issue('UNSUPPORTED_SCENARIO', ['bills', index, 'dueDay']);
    if ((bill.id !== 'bill-1' && bill.id !== 'bill-2') || seen.has(String(bill.id))) issue('UNSUPPORTED_SCENARIO', ['bills', index, 'id']);
    seen.add(String(bill.id));
    bills.push({ id: bill.id as EssentialBill['id'], amount: money(bill.amount, ['bills', index, 'amount']), source: 'user-reported', independentlyVerified: false });
  }
  if (source.billPriority !== 'first' && source.billPriority !== 'second') issue('UNSUPPORTED_SCENARIO', ['billPriority']);
  const dueDay = day(source.dueDay, ['dueDay']);
  const stockCost = money(source.stockCost, ['stockCost']), grossSales = money(source.grossSales, ['grossSales']), salesLagDays = day(source.salesLagDays, ['salesLagDays']);
  const emergencyInput = object(source.emergency), emergencyAmount = money(emergencyInput.amount, ['emergency', 'amount']), emergencyDay = day(emergencyInput.day, ['emergency', 'day']);
  const probabilityInput = object(source.probability);
  const p = probability(probabilityInput.receipt, ['probability', 'receipt']), q = probability(probabilityInput.sales, ['probability', 'sales']);
  if (probabilityInput.relation !== 'independent' && probabilityInput.relation !== 'linked') issue('UNSUPPORTED_SCENARIO', ['probability', 'relation']);
  if ('joint' in probabilityInput || 'correlation' in probabilityInput) issue('UNSUPPORTED_SCENARIO', ['probability']);
  if ('horizonDays' in source && source.horizonDays !== 30) issue('UNSUPPORTED_SCENARIO', ['horizonDays']);
  try { sumCents([cash, bank, receiptAmount, stockCost, grossSales, emergencyAmount, ...bills.map(bill => bill.amount)]); }
  catch (error) { if (error instanceof MoneyError) issue(error.code, []); else throw error; }
  if (issues.length) return deepFreeze({ ok: false, issues: issues as [ValidationIssue, ...ValidationIssue[]] });
  const assumptions: ProbabilityAssumptions = probabilityInput.relation === 'linked'
    ? { kind: 'linked', receipt: p, sales: q, jointRule: 'minimum-marginal' }
    : { kind: 'independent', receipt: p, sales: q };
  const result: FinancialScenario = {
    horizonDays: 30,
    opening: { cash, bank, source: 'user-reported', independentlyVerified: false },
    receipt: { amount: receiptAmount, timing, status: 'expected-not-cleared', source: 'user-reported', independentlyVerified: false },
    essentials: { bills: bills as unknown as EssentialBills, dueDay, priority: source.billPriority as 'first' | 'second' },
    stock: { purchaseCost: stockCost, estimatedGrossSales: grossSales, salesLagDays, source: 'user-reported', independentlyVerified: false },
    emergency: { amount: emergencyAmount, day: emergencyDay, source: 'user-reported', independentlyVerified: false },
    probability: assumptions,
  };
  deepFreeze(result); registeredScenarios.add(result);
  return deepFreeze({ ok: true, value: result as ValidatedScenario });
}
