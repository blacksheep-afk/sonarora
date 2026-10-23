import { describe, expect, it } from 'vitest';
import { parseMoney, checkedCents, inputCents, addCents, subtractCents, sumCents, roundExpectedCents, toMoneyText, toRand, weightedCents, MAX_AGGREGATE_CENTS } from '../../src/engine/money/index';
import { unwrap, money } from './financial-fixtures';
import { reference } from './r51-reference';
const r51 = reference();
describe('exact-cent operations with independent expectations', () => {
  it.each([['0', 0], ['.3', 30], ['0.30', 30], ['0001.20', 120], [' 12.01 ', 1201], ['10000000.00', 1000000000]])('parses %s without floating rand multiplication', (text, expected) => {
    expect(unwrap(parseMoney(text))).toBe(expected);
    expect(unwrap(parseMoney(text))).toBe(r51.centsOf(text));
  });
  it.each(['-1', '-0', '', ' ', '1e3', '+1', '1.', '0.001', '1.000', 'NaN', 'Infinity', '0x10', '1,00', '10000000.01', '99999999999999999999999999999'])('rejects %s explicitly', text => {
    const result = parseMoney(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toHaveLength(1);
  });
  it('matches independent BigInt cent answers over one-cent boundaries', () => {
    for (const a of [0, 1, 10, 19, 20, 30, 1000000000]) {
      for (const b of [0, 1, 10, 20, 30]) {
        expect(addCents(checkedCents(a), checkedCents(b))).toBe(Number(BigInt(a) + BigInt(b)));
        expect(subtractCents(checkedCents(a), checkedCents(b))).toBe(Number(BigInt(a) - BigInt(b)));
      }
    }
    expect(subtractCents(money('0.30'), money('0.10'))).toBe(20);
    expect(sumCents([money('0.10'), money('0.20')])).toBe(30);
  });
  it('checks every operand and aggregate boundary including cancellation attempts', () => {
    expect(addCents(checkedCents(MAX_AGGREGATE_CENTS), checkedCents(0))).toBe(MAX_AGGREGATE_CENTS);
    expect(() => addCents(checkedCents(MAX_AGGREGATE_CENTS), checkedCents(1))).toThrow('AGGREGATE_LIMIT');
    expect(() => subtractCents(checkedCents(-MAX_AGGREGATE_CENTS), checkedCents(1))).toThrow('AGGREGATE_LIMIT');
    expect(() => checkedCents(0.1)).toThrow('AGGREGATE_LIMIT');
    expect(() => inputCents(-1)).toThrow('NEGATIVE_MONEY');
    expect(() => inputCents(1000000001)).toThrow('INPUT_MONEY_LIMIT');
    expect(() => addCents((MAX_AGGREGATE_CENTS + 1) as ReturnType<typeof checkedCents>, checkedCents(-1))).toThrow();
    expect(() => checkedCents(Infinity)).toThrow();
  });
  it('rounds output ties as R51 does, toward positive infinity', () => {
    expect(roundExpectedCents(0.5)).toBe(1);
    expect(Object.is(roundExpectedCents(-0.5), -0)).toBe(true);
    expect(roundExpectedCents(-1.5)).toBe(-1);
    expect(() => roundExpectedCents(Infinity)).toThrow();
    expect(() => weightedCents(money('1'), NaN)).toThrow('INVALID_PROBABILITY');
  });
  it('converts for display only, with exact signed decimal text', () => {
    expect(toMoneyText(checkedCents(-123))).toBe('-1.23');
    expect(toMoneyText(money('.01'))).toBe('0.01');
    expect(toRand(money('1.01'))).toBe(1.01);
  });
  it('documents the retained R51 binary-weight tie limitation rather than hiding it', () => {
    // Exact rational 50 cents * 29/100 = 14.5 cents -> mathematical half-up 15.
    expect((50n * 29n * 2n + 100n) / 200n).toBe(15n);
    // R51 evaluates the binary product just below 14.5, then Math.round -> 14.
    expect(roundExpectedCents(weightedCents(checkedCents(50), 0.29))).toBe(14);
    expect(r51.expectedCents(50 * 0.29)).toBe(14);
  });
});
