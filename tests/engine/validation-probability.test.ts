import { describe, expect, it } from 'vitest';
import { validateScenario, parseDay, isValidatedScenario } from '../../src/engine/validation/index';
import { buildDistribution, parseProbability } from '../../src/engine/probability/index';
import { compareScenario, compareValidatedScenario } from '../../src/engine/comparison/index';
import type { ValidatedScenario } from '../../src/engine/validation/index';
import { draft, validated, unwrap } from './financial-fixtures';
describe('immutable runtime validation', () => {
  it('accepts input day 14 but rejects day 0, 15, fractions and non-finite values', () => {
    expect(unwrap(parseDay('14'))).toBe(14);
    for (const day of ['0', '15', '30', '1.5', 'Infinity', '']) expect(parseDay(day).ok).toBe(false);
  });
  it.each(['cash', 'bank', 'receivable', 'stockCost', 'grossSales'] as const)('rejects malformed %s before comparison', field => {
    const result = compareScenario(draft({ [field]: '0.001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0].code).toBe('UNSUPPORTED_PRECISION');
  });
  it('requires supported bill IDs, count, priority and shared due date', () => {
    for (const change of [
      { billPriority: 'unknown' }, { bills: [{ id: 'bill-1', amount: '1' }, { id: 'bill-1', amount: '2' }] },
      { bills: [{ id: 'bill-1', amount: '1', dueDay: '3' }] },
      { bills: [1, 2, 3].map(id => ({ id: 'bill-' + id, amount: '1' })) },
    ]) expect(validateScenario({ ...draft(), ...change } as Parameters<typeof validateScenario>[0]).ok).toBe(false);
  });
  it('excludes unknown timing without accepting an invented day', () => {
    expect(validateScenario(draft({ receiptTiming: { kind: 'unknown' } })).ok).toBe(true);
    expect(validateScenario(draft({ receiptTiming: { kind: 'unknown', day: '1' } as never })).ok).toBe(false);
  });
  it('copies and freezes owned scenario data without freezing or retaining raw aliases', () => {
    const raw = { ...draft(), bills: [{ id: 'bill-1', amount: '1' }] };
    const scenario = unwrap(validateScenario(raw));
    raw.bills[0]!.amount = '999';
    expect(scenario.essentials.bills[0]?.amount).toBe(100);
    expect(Object.isFrozen(scenario)).toBe(true);
    expect(Object.isFrozen(scenario.essentials.bills)).toBe(true);
    expect(Object.isFrozen(raw.bills)).toBe(false);
    expect(isValidatedScenario(scenario)).toBe(true);
  });
  it('rejects unregistered typed/cast scenarios at normal simulation boundaries', () => {
    const forged = { ...validated() } as ValidatedScenario;
    expect(compareValidatedScenario(forged).ok).toBe(false);
    expect(compareScenario(null as never).ok).toBe(false);
  });
  it('rejects unsupported horizons, probability bounds and correlation models', () => {
    expect(validateScenario({ ...draft(), horizonDays: 14 } as never).ok).toBe(false);
    expect(validateScenario(draft({ probability: { receipt: '1.01', sales: '.5', relation: 'independent' } })).ok).toBe(false);
    expect(validateScenario(draft({ probability: { receipt: '.5', sales: '.5', relation: 'arbitrary' } })).ok).toBe(false);
    expect(validateScenario(draft({ probability: { receipt: '.5', sales: '.5', relation: 'linked', correlation: '.2' } as never })).ok).toBe(false);
  });
});
describe('probabilities derived from independent expectations', () => {
  it('has independent weights .45/.15/.30/.10', () => {
    const assumptions = validated().probability;
    const outcomes = unwrap(buildDistribution(assumptions, true)).outcomes;
    expect(outcomes.map(value => value.weight)).toEqual(expect.arrayContaining([expect.closeTo(.45, 12), expect.closeTo(.15, 12), expect.closeTo(.30, 12), expect.closeTo(.10, 12)]));
  });
  it('uses linked minimum marginals and omits the zero receipt-only path', () => {
    const scenario = validated({ probability: { receipt: '.6', sales: '.75', relation: 'linked' } });
    const outcomes = unwrap(buildDistribution(scenario.probability, true)).outcomes;
    expect(outcomes).toHaveLength(3);
    expect(outcomes.find(value => value.receiptArrives && value.salesSucceed)?.weight).toBe(.6);
    expect(outcomes.find(value => !value.receiptArrives && !value.salesSucceed)?.weight).toBe(.25);
  });
  it('checks bounds and total weights over both models', () => {
    for (const p of ['0', '.25', '.5', '.75', '1']) for (const q of ['0', '.25', '.5', '.75', '1']) for (const relation of ['independent', 'linked']) {
      const scenario = validated({ probability: { receipt: p, sales: q, relation } });
      const outcomes = unwrap(buildDistribution(scenario.probability, true)).outcomes;
      expect(outcomes.every(value => value.weight > 0 && value.weight <= 1)).toBe(true);
      expect(outcomes.reduce((sum, value) => sum + value.weight, 0)).toBeCloseTo(1, 12);
    }
    for (const value of ['', '-.1', '1.1', 'NaN', 'Infinity']) expect(parseProbability(value).ok).toBe(false);
  });
  it('drops receipt paths for unknown dates and retains R51 negligible-path filtering', () => {
    const scenario = validated({ probability: { receipt: '1', sales: '.75', relation: 'independent' } });
    expect(unwrap(buildDistribution(scenario.probability, false)).outcomes.every(value => !value.receiptArrives)).toBe(true);
    const tiny = validated({ probability: { receipt: '0.00000000001', sales: '0', relation: 'independent' } });
    const result = unwrap(buildDistribution(tiny.probability, true));
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes[0]?.weight).toBe(1 - 1e-11);
  });
});
