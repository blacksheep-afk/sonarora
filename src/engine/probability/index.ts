declare const probabilityBrand: unique symbol;
declare const percentageBrand: unique symbol;
/** Validated finite 0..1, never a monetary value. */
export type Probability = number & { readonly [probabilityBrand]: true };
/** R51 rounded display percentage, distinct from a distribution weight. */
export type DisplayPercent = number & { readonly [percentageBrand]: true };
export type ProbabilityAssumptions =
  | Readonly<{ kind: 'independent'; receipt: Probability; sales: Probability }>
  | Readonly<{ kind: 'linked'; receipt: Probability; sales: Probability; jointRule: 'minimum-marginal' }>;
export interface JointOutcome {
  readonly receiptArrives: boolean;
  readonly salesSucceed: boolean;
  readonly weight: Probability;
}
export interface JointDistribution {
  readonly outcomes: readonly JointOutcome[];
  readonly receiptExcludedBecauseDateUnknown: boolean;
}
/** Checked R51-compatible distribution: no arbitrary correlation parameter. */
export type BuildDistribution = (assumptions: ProbabilityAssumptions, receiptDateKnown: boolean) => ProbabilityResult<JointDistribution>;

export type ProbabilityCode = 'INVALID_PROBABILITY' | 'INVALID_JOINT_PROBABILITY' | 'UNSUPPORTED_SCENARIO';
export type ProbabilityResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; issues: readonly [Readonly<{ code: ProbabilityCode; path: readonly (string | number)[]; messageKey: string }>] }>;
function probabilityFailure<T>(code: ProbabilityCode): ProbabilityResult<T> {
  return Object.freeze({ ok: false, issues: Object.freeze([Object.freeze({ code, path: Object.freeze([]), messageKey: 'probability.' + code })]) as readonly [Readonly<{ code: ProbabilityCode; path: readonly (string | number)[]; messageKey: string }>] });
}
export function isProbability(value: unknown): value is Probability {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}
export function parseProbability(text: string): ProbabilityResult<Probability> {
  if (typeof text !== 'string' || text.trim() === '') return probabilityFailure('INVALID_PROBABILITY');
  const value = Number(text);
  return isProbability(value) ? Object.freeze({ ok: true, value }) : probabilityFailure('INVALID_PROBABILITY');
}
export function displayPercent(weight: number): DisplayPercent {
  if (!isProbability(weight) && !(Number.isFinite(weight) && weight >= 0 && weight <= 1 + 1e-12)) throw new RangeError('INVALID_PROBABILITY');
  return (Math.round(weight * 100 * 100) / 100) as DisplayPercent;
}
export function buildDistribution(assumptions: ProbabilityAssumptions, receiptDateKnown: boolean): ProbabilityResult<JointDistribution> {
  if (!assumptions || !isProbability(assumptions.receipt) || !isProbability(assumptions.sales) || typeof receiptDateKnown !== 'boolean') return probabilityFailure('INVALID_PROBABILITY');
  if (assumptions.kind !== 'independent' && assumptions.kind !== 'linked') return probabilityFailure('UNSUPPORTED_SCENARIO');
  if (assumptions.kind === 'linked' && assumptions.jointRule !== 'minimum-marginal') return probabilityFailure('UNSUPPORTED_SCENARIO');
  const p = receiptDateKnown ? assumptions.receipt : 0;
  const q = assumptions.sales;
  const joint = assumptions.kind === 'independent' ? p * q : Math.min(p, q);
  const neither = 1 - p - q + joint;
  if (neither < -1e-9) return probabilityFailure('INVALID_JOINT_PROBABILITY');
  const values = [
    { receiptArrives: true, salesSucceed: true, weight: joint },
    { receiptArrives: true, salesSucceed: false, weight: p - joint },
    { receiptArrives: false, salesSucceed: true, weight: q - joint },
    { receiptArrives: false, salesSucceed: false, weight: Math.max(0, neither) },
  ].filter(value => value.weight > 1e-10);
  if (values.some(value => !isProbability(value.weight)) || Math.abs(values.reduce((total, value) => total + value.weight, 0) - 1) > 4e-10) return probabilityFailure('INVALID_JOINT_PROBABILITY');
  const outcomes = Object.freeze(values.map(value => Object.freeze({ ...value, weight: value.weight as Probability })));
  return Object.freeze({ ok: true, value: Object.freeze({ outcomes, receiptExcludedBecauseDateUnknown: !receiptDateKnown }) });
}
