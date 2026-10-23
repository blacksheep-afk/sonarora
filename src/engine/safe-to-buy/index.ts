import type { InputCents, NonNegativeCents, ExpectedCents } from '../money/index';
import type { Day, EssentialBill, FinancialScenario, UserReported } from '../scenario/index';
import type { Revision, ConfirmationSet } from '../state/index';
import type { Explanation } from '../explanations/index';
export interface SupplierTerms extends UserReported {
  readonly splitAcceptance: 'unreported' | 'accepted' | 'not-accepted';
  readonly minimumBatch: InputCents;
  readonly increment: InputCents;
  readonly firstDeliveryFee: InputCents;
  readonly secondDeliveryFee: InputCents;
}
export type OriginalBillState =
  | Readonly<{ status: 'none'; billId: EssentialBill['id'] }>
  | Readonly<{ status: 'unresolved'; bill: EssentialBill }>
  | Readonly<{ status: 'unpaid'; bill: EssentialBill; outstanding: NonNegativeCents }>
  | Readonly<{ status: 'partial'; bill: EssentialBill; paidAmount: InputCents; outstanding: NonNegativeCents }>
  | Readonly<{ status: 'paid'; bill: EssentialBill; outstanding: NonNegativeCents }>;
export interface ReportedClearedReceipt extends UserReported {
  readonly status: 'reported-cleared';
  readonly amount: InputCents;
  readonly day: Day;
}
export interface RefreshedFunds extends UserReported {
  /** Already includes any reported cleared receipt; never add it again. */
  readonly clearedBalance: InputCents;
  readonly remainingOtherBills: InputCents;
  readonly remainingEmergency: InputCents;
}
export interface SafeToBuyInput {
  readonly inputRevision: Revision;
  readonly supplier: SupplierTerms;
  readonly starterCost: InputCents;
  readonly starterGrossSalesEstimate: InputCents;
  readonly remainderGrossSalesEstimate: InputCents;
  /** Opening funds, full stock cost, dates and sales assumptions come from this scenario. */
  readonly scenario: FinancialScenario;
  readonly buffer: InputCents;
  readonly originalBills: readonly [OriginalBillState, OriginalBillState];
  readonly clearedReceipt: ReportedClearedReceipt | null;
  readonly refreshedFunds: RefreshedFunds | null;
  readonly confirmations: ConfirmationSet;
}
export interface ModelledPurchase {
  readonly stockCost: NonNegativeCents;
  readonly deliveryFee: NonNegativeCents;
  readonly reservedFunds: NonNegativeCents;
  readonly availableAfterReserve: NonNegativeCents;
  /** R51 simplified expected gross sales less stock/fees, not profit. */
  readonly expectedSalesSurplus: ExpectedCents;
}
export type LaterBatch =
  | Readonly<{ status: 'locked'; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'modelled-feasible'; purchase: ModelledPurchase }>;
export type SafeToBuyPlan =
  | Readonly<{ status: 'incomplete'; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'blocked'; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'locked'; stage: 'later'; starter: ModelledPurchase; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'modelled-feasible'; starter: ModelledPurchase; later: LaterBatch; explanations: readonly Explanation[] }>;
export type PlanSafeToBuy = (input: SafeToBuyInput) => SafeToBuyPlan;
