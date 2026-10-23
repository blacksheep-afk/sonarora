import { describe, expect, it } from 'vitest';
import {
  createDecisionState, financialInputChanged, acceptResult, currentResult,
  confirmUserReport, confirmationsAreCurrent,
} from '../../src/engine/state/index';
import type { DecisionState, Revision, Transition } from '../../src/engine/state/index';

function accepted<T>(transition: Transition<T>): DecisionState<T> {
  if (!transition.accepted) throw new Error(transition.code);
  return transition.state;
}
describe('revision transition rules only', () => {
  it('starts dirty, with no result or confirmations', () => {
    const state = createDecisionState<string>();
    expect(state.status).toBe('dirty');
    expect(state.inputRevision).toBe(0);
    expect(currentResult(state)).toBeNull();
    expect(confirmationsAreCurrent(state)).toBe(false);
  });
  it('publishes only a result for the current revision', () => {
    const state = createDecisionState<string>();
    const next = accepted(acceptResult(state, { revision: state.inputRevision, value: 'modelled result' }));
    expect(currentResult(next)).toBe('modelled result');
    expect(currentResult(state)).toBeNull();
    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.result)).toBe(true);
  });
  it('invalidates results and every dependent confirmation immediately on edit', () => {
    let state = createDecisionState<string>();
    state = accepted(acceptResult(state, { revision: state.inputRevision, value: 'old' }));
    for (const kind of ['receipt', 'balance', 'liabilities'] as const) {
      state = accepted(confirmUserReport(state, kind, state.inputRevision));
    }
    expect(confirmationsAreCurrent(state)).toBe(true);
    const edited = financialInputChanged(state);
    expect(edited.inputRevision).toBe(1);
    expect(currentResult(edited)).toBeNull();
    expect(edited.confirmations).toEqual({ receipt: null, balance: null, liabilities: null });
    expect(currentResult(state)).toBe('old');
    expect(confirmationsAreCurrent(edited)).toBe(false);
  });
  it('rejects a late asynchronous result without overwriting the edited state', () => {
    const initial = createDecisionState<string>();
    const edited = financialInputChanged(initial);
    const rejected = acceptResult(edited, { revision: initial.inputRevision, value: 'stale' });
    expect(rejected).toEqual({ accepted: false, code: 'STALE_RESULT', state: edited });
    expect(rejected.state).toBe(edited);
    expect(currentResult(rejected.state)).toBeNull();
  });
  it('rejects stale confirmations, preserves source and requires all three', () => {
    const initial = createDecisionState<string>();
    let state = financialInputChanged(initial);
    expect(confirmUserReport(state, 'receipt', initial.inputRevision).accepted).toBe(false);
    state = accepted(confirmUserReport(state, 'receipt', state.inputRevision));
    expect(confirmationsAreCurrent(state)).toBe(false);
    expect(state.confirmations.receipt).toMatchObject({ source: 'user-reported', independentlyVerified: false });
    state = accepted(confirmUserReport(state, 'balance', state.inputRevision));
    state = accepted(confirmUserReport(state, 'liabilities', state.inputRevision));
    expect(confirmationsAreCurrent(state)).toBe(true);
    expect(Object.isFrozen(state.confirmations)).toBe(true);
  });
  it('repeated edits cannot revive previous results or confirmations', () => {
    let state = createDecisionState<string>();
    for (let revision = 0; revision < 5; revision++) {
      expect(state.inputRevision).toBe(revision);
      state = accepted(acceptResult(state, { revision: state.inputRevision, value: 'old' }));
      state = financialInputChanged(state);
      expect(currentResult(state)).toBeNull();
      expect(confirmationsAreCurrent(state)).toBe(false);
    }
  });
  it('defensively hides an externally forged stale result envelope', () => {
    const state = {
      status: 'current', inputRevision: 1 as Revision,
      result: { revision: 0 as Revision, value: 'stale' },
      confirmations: { receipt: null, balance: null, liabilities: null },
    } as const satisfies DecisionState<string>;
    expect(currentResult(state)).toBeNull();
  });
  it('rejects invalid revision values and fails closed at safe-integer exhaustion', () => {
    const initial = createDecisionState<string>();
    for (const revision of [NaN, Infinity, -1, 0.5]) {
      expect(acceptResult(initial, { revision: revision as Revision, value: 'bad' }).accepted).toBe(false);
      expect(confirmUserReport(initial, 'receipt', revision as Revision).accepted).toBe(false);
    }
    expect(() => financialInputChanged({ ...initial, inputRevision: Number.MAX_SAFE_INTEGER as Revision })).toThrow(RangeError);
  });
});
