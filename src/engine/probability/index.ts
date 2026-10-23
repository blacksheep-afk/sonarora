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
/** Declares a future implementation; no distribution is calculated in this sprint. */
export type BuildDistribution = (assumptions: ProbabilityAssumptions, receiptDateKnown: boolean) => JointDistribution;
