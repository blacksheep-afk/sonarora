/** Type boundary only. No parsing, rounding or arithmetic implementation in Sprint 1. */
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
