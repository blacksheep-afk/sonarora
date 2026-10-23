/** Pure revision transitions only; no financial validation, calculation or UI behavior. */
declare const revisionBrand: unique symbol;
export type Revision = number & { readonly [revisionBrand]: true };
export type ConfirmationKind = 'receipt' | 'balance' | 'liabilities';
export interface UserAttestation {
  readonly revision: Revision;
  readonly source: 'user-reported';
  readonly independentlyVerified: false;
}
export interface Revisioned<T> {
  readonly revision: Revision;
  readonly value: T;
}
export type ConfirmationSet = Readonly<Record<ConfirmationKind, UserAttestation | null>>;
export type DecisionState<T> =
  | Readonly<{ status: 'dirty'; inputRevision: Revision; result: null; confirmations: ConfirmationSet }>
  | Readonly<{ status: 'current'; inputRevision: Revision; result: Revisioned<T>; confirmations: ConfirmationSet }>;
export type StateRejection = 'STALE_RESULT' | 'STALE_CONFIRMATION';
export type Transition<T> =
  | Readonly<{ accepted: true; state: DecisionState<T> }>
  | Readonly<{ accepted: false; code: StateRejection; state: DecisionState<T> }>;
function emptyConfirmations(): ConfirmationSet {
  return Object.freeze({ receipt: null, balance: null, liabilities: null });
}
function isRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
export function createDecisionState<T>(): DecisionState<T> {
  return Object.freeze({ status: 'dirty', inputRevision: 0 as Revision, result: null, confirmations: emptyConfirmations() });
}
export function financialInputChanged<T>(state: DecisionState<T>): DecisionState<T> {
  if (!isRevision(state.inputRevision) || state.inputRevision >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Input revision exhausted or invalid; create a fresh decision session');
  }
  return Object.freeze({ status: 'dirty', inputRevision: (state.inputRevision + 1) as Revision, result: null, confirmations: emptyConfirmations() });
}
export function acceptResult<T>(state: DecisionState<T>, candidate: Revisioned<T>): Transition<T> {
  if (!isRevision(candidate.revision) || candidate.revision !== state.inputRevision) {
    return Object.freeze({ accepted: false, code: 'STALE_RESULT', state });
  }
  const result = Object.freeze({ revision: candidate.revision, value: candidate.value });
  return Object.freeze({ accepted: true, state: Object.freeze({ ...state, status: 'current', result }) });
}
export function confirmUserReport<T>(state: DecisionState<T>, kind: ConfirmationKind, capturedRevision: Revision): Transition<T> {
  if (!isRevision(capturedRevision) || capturedRevision !== state.inputRevision) {
    return Object.freeze({ accepted: false, code: 'STALE_CONFIRMATION', state });
  }
  const attestation: UserAttestation = Object.freeze({ revision: capturedRevision, source: 'user-reported', independentlyVerified: false });
  const confirmations = Object.freeze({ ...state.confirmations, [kind]: attestation });
  return Object.freeze({ accepted: true, state: Object.freeze({ ...state, confirmations }) });
}
export function currentResult<T>(state: DecisionState<T>): T | null {
  return state.status === 'current' && isRevision(state.inputRevision) && state.result.revision === state.inputRevision
    ? state.result.value : null;
}
export function confirmationsAreCurrent<T>(state: DecisionState<T>): boolean {
  return isRevision(state.inputRevision) && (['receipt', 'balance', 'liabilities'] as const).every(kind => {
    const report = state.confirmations[kind];
    return report !== null && report.revision === state.inputRevision && report.source === 'user-reported' && report.independentlyVerified === false;
  });
}
