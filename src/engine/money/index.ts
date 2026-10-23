/** Canonical integer cents; decimal digits are parsed with BigInt, then bounded numbers. */
declare const centBrand: unique symbol;
declare const nonnegativeBrand: unique symbol;
declare const inputBrand: unique symbol;
declare const expectedBrand: unique symbol;
export type Cents = number & { readonly [centBrand]: 'exact-integer-cents' };
export type NonNegativeCents = Cents & { readonly [nonnegativeBrand]: true };
export type InputCents = NonNegativeCents & { readonly [inputBrand]: 'bounded-input' };
export type ExpectedCents = Cents & { readonly [expectedBrand]: 'rounded-at-output-boundary' };
export const MAX_INPUT_CENTS = 1_000_000_000;
export const MAX_AGGREGATE_CENTS = 100_000_000_000;
export type MoneyText = string;

export type MoneyCode = 'MALFORMED_MONEY' | 'UNSUPPORTED_PRECISION' | 'NEGATIVE_MONEY' | 'INPUT_MONEY_LIMIT' | 'AGGREGATE_LIMIT';
export type MoneyResult =
  | Readonly<{ ok: true; value: InputCents }>
  | Readonly<{ ok: false; issues: readonly [Readonly<{ code: MoneyCode; path: readonly (string | number)[]; messageKey: string }>] }>;
export class MoneyError extends RangeError {
  readonly code: MoneyCode;
  constructor(code: MoneyCode) { super(code); this.name = 'MoneyError'; this.code = code; }
}
export function checkedCents(value: number): Cents {
  if (!Number.isSafeInteger(value) || Math.abs(value) > MAX_AGGREGATE_CENTS) throw new MoneyError('AGGREGATE_LIMIT');
  return value as Cents;
}
export function nonNegativeCents(value: number): NonNegativeCents {
  checkedCents(value);
  if (value < 0) throw new MoneyError('NEGATIVE_MONEY');
  return value as NonNegativeCents;
}
export function inputCents(value: number): InputCents {
  nonNegativeCents(value);
  if (value > MAX_INPUT_CENTS) throw new MoneyError('INPUT_MONEY_LIMIT');
  return value as InputCents;
}
export function parseMoney(text: string): MoneyResult {
  const fail = (code: MoneyCode): MoneyResult => Object.freeze({ ok: false, issues: Object.freeze([Object.freeze({ code, path: Object.freeze([]), messageKey: 'money.' + code })] as const) });
  if (typeof text !== 'string') return fail('MALFORMED_MONEY');
  const raw = text.trim();
  if (raw.startsWith('-')) return fail('NEGATIVE_MONEY');
  if (/^(?:\d+)?\.\d{3,}$/.test(raw)) return fail('UNSUPPORTED_PRECISION');
  const match = /^(?:(\d+)(?:\.(\d{1,2}))?|\.(\d{1,2}))$/.exec(raw);
  if (!match) return fail('MALFORMED_MONEY');
  const whole = (match[1] ?? '0').replace(/^0+/, '') || '0';
  if (whole.length > 8) return fail('INPUT_MONEY_LIMIT');
  const cents = BigInt(whole) * 100n + BigInt((match[2] ?? match[3] ?? '').padEnd(2, '0') || '0');
  if (cents > BigInt(MAX_INPUT_CENTS)) return fail('INPUT_MONEY_LIMIT');
  return Object.freeze({ ok: true, value: inputCents(Number(cents)) });
}
export function addCents(a: Cents, b: Cents): Cents {
  checkedCents(a); checkedCents(b); return checkedCents(a + b);
}
export function subtractCents(a: Cents, b: Cents): Cents {
  checkedCents(a); checkedCents(b); return checkedCents(a - b);
}
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce<Cents>((total, value) => addCents(total, value), checkedCents(0));
}
export function checkedExpected(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_AGGREGATE_CENTS) throw new MoneyError('AGGREGATE_LIMIT');
  return value;
}
export function roundExpectedCents(value: number): ExpectedCents {
  return checkedCents(Math.round(checkedExpected(value))) as ExpectedCents;
}
export function weightedCents(amount: Cents, weight: number): number {
  checkedCents(amount);
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new RangeError('INVALID_PROBABILITY');
  return checkedExpected(amount * weight);
}
export function toRand(value: Cents): number { return checkedCents(value) / 100; }
export function toMoneyText(value: Cents): string {
  const integer = BigInt(checkedCents(value));
  const absolute = integer < 0n ? -integer : integer;
  return (integer < 0n ? '-' : '') + String(absolute / 100n) + '.' + String(absolute % 100n).padStart(2, '0');
}
