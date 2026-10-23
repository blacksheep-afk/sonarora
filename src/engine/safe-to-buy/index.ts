import type { InputCents, NonNegativeCents, ExpectedCents } from '../money/index';
import type { EssentialBill, FinancialScenario, UserReported } from '../scenario/index';
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
  readonly day: ReportedReceiptDay;
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
export type SafeToBuyPlan = SafeAssessment & (
  | Readonly<{ status: 'incomplete'; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'blocked'; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'locked'; stage: 'later'; starter: ModelledPurchase; explanations: readonly Explanation[] }>
  | Readonly<{ status: 'modelled-feasible'; starter: ModelledPurchase; later: LaterBatch; explanations: readonly Explanation[] }>);
export type PlanSafeToBuy = (input: SafeToBuyInput) => ValidationResult<SafeToBuyPlan>;

import type { Cents } from '../money/index';
import { inputCents, checkedCents, nonNegativeCents, sumCents, addCents, subtractCents, checkedExpected, weightedCents, roundExpectedCents, MoneyError } from '../money/index';
import type { ValidationResult, ValidationIssue, ValidationCode } from '../validation/index';
import { failure, deepFreeze, isValidatedScenario } from '../validation/index';
import type { ReasonCode } from '../explanations/index';
declare const reportedDayBrand: unique symbol;
export type ReportedReceiptDay = number & { readonly [reportedDayBrand]: true };
export interface SafeAssessment extends UserReported {
  readonly assessment: 'modelled-not-advice';
  readonly diagnostics?: SafeToBuyDiagnostics;
}
export interface SafeToBuyDiagnostics {
  readonly reserve: NonNegativeCents;
  readonly availableNow: Cents;
  readonly starterSpend: NonNegativeCents;
  readonly firstBalance: Cents;
  readonly remainder: NonNegativeCents;
  readonly starterExpectedSurplus: ExpectedCents;
  readonly remainderExpectedSurplus: ExpectedCents;
  readonly receiptConfirmed: boolean;
  readonly remainingReserve: NonNegativeCents;
  readonly liabilitiesResolved: boolean;
  readonly currentFunds: InputCents;
  readonly availableForRemainder: Cents;
  readonly remainderSpend: NonNegativeCents;
  readonly secondUnlocked: boolean;
}
export function reportedReceiptDay(value: number): ValidationResult<ReportedReceiptDay> {
  return Number.isSafeInteger(value) && value >= 0 ? deepFreeze({ ok: true, value: value as ReportedReceiptDay }) : failure('INVALID_DAY');
}
function validateSafeInput(input: SafeToBuyInput): ValidationResult<SafeToBuyInput> {
  if (!input || typeof input !== 'object') return failure('INCOMPLETE_INPUT');
  if (!isValidatedScenario(input.scenario)) return failure('UNSUPPORTED_SCENARIO', ['scenario']);
  const issues: ValidationIssue[] = [];
  const issue = (code: ValidationCode, path: readonly (string | number)[]) => issues.push({ code, path, messageKey: 'validation.' + code });
  const record = (value: unknown, path: readonly (string | number)[]): Record<string, unknown> => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    issue('INCOMPLETE_INPUT', path); return {};
  };
  const money = (value: unknown, path: readonly (string | number)[]): InputCents => {
    if (typeof value !== 'number' || !Number.isFinite(value)) { issue('MALFORMED_MONEY', path); return 0 as InputCents; }
    if (!Number.isInteger(value)) { issue('UNSUPPORTED_PRECISION', path); return 0 as InputCents; }
    try { return inputCents(value); }
    catch (error) { if (error instanceof MoneyError) { issue(error.code, path); return 0 as InputCents; } throw error; }
  };
  const report = (value: Record<string, unknown>, path: readonly (string | number)[]) => {
    if (value.source !== 'user-reported' || value.independentlyVerified !== false) issue('CONTRADICTORY_CONFIRMATION', path);
  };
  const supplierInput = record(input.supplier, ['supplier']); report(supplierInput, ['supplier']);
  if (!['unreported', 'accepted', 'not-accepted'].includes(String(supplierInput.splitAcceptance))) issue('UNSUPPORTED_SCENARIO', ['supplier', 'splitAcceptance']);
  const supplier: SupplierTerms = {
    source: 'user-reported', independentlyVerified: false,
    splitAcceptance: supplierInput.splitAcceptance as SupplierTerms['splitAcceptance'],
    minimumBatch: money(supplierInput.minimumBatch, ['supplier', 'minimumBatch']),
    increment: money(supplierInput.increment, ['supplier', 'increment']),
    firstDeliveryFee: money(supplierInput.firstDeliveryFee, ['supplier', 'firstDeliveryFee']),
    secondDeliveryFee: money(supplierInput.secondDeliveryFee, ['supplier', 'secondDeliveryFee']),
  };
  if (!Number.isSafeInteger(input.inputRevision) || input.inputRevision < 0) issue('CONTRADICTORY_CONFIRMATION', ['inputRevision']);
  const starterCost = money(input.starterCost, ['starterCost']), starterSales = money(input.starterGrossSalesEstimate, ['starterGrossSalesEstimate']);
  const remainderSales = money(input.remainderGrossSalesEstimate, ['remainderGrossSalesEstimate']), buffer = money(input.buffer, ['buffer']);
  const confirmationInput = record(input.confirmations, ['confirmations']);
  const confirmations: Record<'receipt' | 'balance' | 'liabilities', ConfirmationSet['receipt']> = { receipt: null, balance: null, liabilities: null };
  for (const kind of ['receipt', 'balance', 'liabilities'] as const) {
    const raw = confirmationInput[kind];
    if (raw === null || raw === undefined) continue;
    const value = record(raw, ['confirmations', kind]); report(value, ['confirmations', kind]);
    if (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) issue('CONTRADICTORY_CONFIRMATION', ['confirmations', kind, 'revision']);
    confirmations[kind] = { revision: value.revision as Revision, source: 'user-reported', independentlyVerified: false };
  }
  let receipt: ReportedClearedReceipt | null = null;
  if (input.clearedReceipt != null) {
    const raw = record(input.clearedReceipt, ['clearedReceipt']); report(raw, ['clearedReceipt']);
    if (raw.status !== 'reported-cleared') issue('CONTRADICTORY_CONFIRMATION', ['clearedReceipt', 'status']);
    const day = reportedReceiptDay(raw.day as number);
    if (!day.ok) issue('INVALID_DAY', ['clearedReceipt', 'day']);
    receipt = { source: 'user-reported', independentlyVerified: false, status: 'reported-cleared', amount: money(raw.amount, ['clearedReceipt', 'amount']), day: day.ok ? day.value : 0 as ReportedReceiptDay };
  }
  let funds: RefreshedFunds | null = null;
  if (input.refreshedFunds != null) {
    const raw = record(input.refreshedFunds, ['refreshedFunds']); report(raw, ['refreshedFunds']);
    funds = { source: 'user-reported', independentlyVerified: false,
      clearedBalance: money(raw.clearedBalance, ['refreshedFunds', 'clearedBalance']),
      remainingOtherBills: money(raw.remainingOtherBills, ['refreshedFunds', 'remainingOtherBills']),
      remainingEmergency: money(raw.remainingEmergency, ['refreshedFunds', 'remainingEmergency']) };
  }
  if (confirmations.receipt?.revision === input.inputRevision && receipt === null) issue('CONTRADICTORY_CONFIRMATION', ['clearedReceipt']);
  if (confirmations.balance?.revision === input.inputRevision && funds === null) issue('CONTRADICTORY_CONFIRMATION', ['refreshedFunds']);
  const states: OriginalBillState[] = [], ids = new Set<string>();
  if (!Array.isArray(input.originalBills) || input.originalBills.length !== 2) issue('INCOMPLETE_INPUT', ['originalBills']);
  for (const [index, rawValue] of (Array.isArray(input.originalBills) ? input.originalBills.slice(0, 2) : []).entries()) {
    const raw = record(rawValue, ['originalBills', index]);
    const billInput = raw.status === 'none' ? null : record(raw.bill, ['originalBills', index, 'bill']);
    const id = String(billInput?.id ?? raw.billId);
    if (!['bill-1', 'bill-2'].includes(id) || ids.has(id)) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index]);
    ids.add(id);
    const original = input.scenario.essentials.bills.find(bill => bill.id === id);
    const amount = original?.amount ?? 0 as InputCents;
    if (raw.status === 'none') {
      if (amount !== 0 || ('paidAmount' in raw && raw.paidAmount !== 0) || ('outstanding' in raw && raw.outstanding !== 0) || raw.bill != null) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index]);
      states.push({ status: 'none', billId: id as EssentialBill['id'] });
      continue;
    }
    if (billInput) {
      report(billInput, ['originalBills', index, 'bill']);
      if (money(billInput.amount, ['originalBills', index, 'bill', 'amount']) !== amount || amount <= 0) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index, 'bill']);
    }
    const bill: EssentialBill = { id: id as EssentialBill['id'], amount, source: 'user-reported', independentlyVerified: false };
    if ('paidAmount' in raw && raw.status !== 'partial' && raw.paidAmount !== 0) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index, 'paidAmount']);
    if (raw.status === 'unresolved') {
      if ('outstanding' in raw && raw.outstanding !== amount) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index, 'outstanding']);
      states.push({ status: 'unresolved', bill }); continue;
    }
    const outstanding = money(raw.outstanding, ['originalBills', index, 'outstanding']);
    if (raw.status === 'unpaid') {
      if (outstanding !== amount) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index, 'outstanding']);
      states.push({ status: 'unpaid', bill, outstanding });
    } else if (raw.status === 'paid') {
      if (outstanding !== 0) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index, 'outstanding']);
      states.push({ status: 'paid', bill, outstanding });
    } else if (raw.status === 'partial') {
      const paid = money(raw.paidAmount, ['originalBills', index, 'paidAmount']);
      if (paid <= 0 || paid >= amount || outstanding !== subtractCents(amount, paid)) issue('CONTRADICTORY_CONFIRMATION', ['originalBills', index]);
      states.push({ status: 'partial', bill, outstanding, paidAmount: paid });
    } else issue('UNSUPPORTED_SCENARIO', ['originalBills', index, 'status']);
  }
  if (issues.length) return deepFreeze({ ok: false, issues: issues as [ValidationIssue, ...ValidationIssue[]] });
  return deepFreeze({ ok: true, value: {
    inputRevision: input.inputRevision, scenario: input.scenario, supplier, starterCost,
    starterGrossSalesEstimate: starterSales, remainderGrossSalesEstimate: remainderSales, buffer,
    originalBills: states as [OriginalBillState, OriginalBillState], clearedReceipt: receipt, refreshedFunds: funds, confirmations,
  } });
}
function explanation(code: ReasonCode): Explanation {
  return { code, facts: {}, caveats: ['USER_REPORTED', 'HYPOTHETICAL', 'SALES_SURPLUS_NOT_PROFIT', 'NOT_A_PAYMENT'] };
}
export function planSafeToBuy(raw: SafeToBuyInput): ValidationResult<SafeToBuyPlan> {
  const validation = validateSafeInput(raw);
  if (!validation.ok) return validation;
  const input = validation.value;
  const meta = { assessment: 'modelled-not-advice', source: 'user-reported', independentlyVerified: false } as const;
  const finish = (value: SafeToBuyPlan): ValidationResult<SafeToBuyPlan> => deepFreeze({ ok: true, value });
  if (input.supplier.splitAcceptance !== 'accepted') return finish({ ...meta, status: input.supplier.splitAcceptance === 'unreported' ? 'incomplete' : 'blocked', explanations: [explanation('SUPPLIER_SPLIT_NOT_ACCEPTED')] });
  try {
    const scenario = input.scenario, terms = input.supplier;
    const totalStock = scenario.stock.purchaseCost, starter = input.starterCost;
    if (totalStock <= 0 || starter <= 0 || starter >= totalStock) return finish({ ...meta, status: 'blocked', explanations: [explanation('INVALID_ORDER')] });
    const remainder = nonNegativeCents(subtractCents(totalStock, starter));
    const reasons: Explanation[] = [];
    for (const amount of [starter, remainder]) {
      if (amount < terms.minimumBatch) reasons.push(explanation('SUPPLIER_MINIMUM'));
      if (terms.increment > 0 && amount % terms.increment !== 0) reasons.push(explanation('SUPPLIER_INCREMENT'));
    }
    if (reasons.length) return finish({ ...meta, status: 'blocked', explanations: reasons });
    const firstSpend = nonNegativeCents(addCents(starter, terms.firstDeliveryFee));
    const secondSpend = nonNegativeCents(addCents(remainder, terms.secondDeliveryFee));
    const firstExpected = roundExpectedCents(checkedExpected(weightedCents(input.starterGrossSalesEstimate, scenario.probability.sales) - firstSpend));
    const secondExpected = roundExpectedCents(checkedExpected(weightedCents(input.remainderGrossSalesEstimate, scenario.probability.sales) - secondSpend));
    if (firstExpected <= 0 || secondExpected <= 0) reasons.push(explanation('SALES_ESTIMATE_INSUFFICIENT'));
    const reserve = nonNegativeCents(sumCents([...scenario.essentials.bills.map(bill => bill.amount), scenario.emergency.amount, input.buffer]));
    const opening = nonNegativeCents(addCents(scenario.opening.cash, scenario.opening.bank));
    const safeNow = subtractCents(opening, reserve);
    const firstBalance = subtractCents(opening, firstSpend);
    if (firstSpend > safeNow) reasons.push(explanation('INSUFFICIENT_CLEARED_FUNDS'));
    let tracked = checkedCents(0), liabilitiesResolved = true;
    for (const state of input.originalBills) {
      if (state.status === 'unresolved') { tracked = addCents(tracked, state.bill.amount); liabilitiesResolved = false; }
      if (state.status === 'unpaid' || state.status === 'partial') tracked = addCents(tracked, state.outstanding);
    }
    const fresh = (kind: 'receipt' | 'balance' | 'liabilities') => input.confirmations[kind]?.revision === input.inputRevision;
    liabilitiesResolved = liabilitiesResolved && fresh('liabilities');
    const currentFunds = input.refreshedFunds?.clearedBalance ?? inputCents(0);
    const remainingReserve = nonNegativeCents(sumCents([tracked, input.refreshedFunds?.remainingOtherBills ?? checkedCents(0), input.refreshedFunds?.remainingEmergency ?? checkedCents(0), input.buffer]));
    const safeForRemainder = subtractCents(currentFunds, remainingReserve);
    const receiptConfirmed = fresh('receipt') && input.clearedReceipt !== null && input.clearedReceipt.amount > 0 && input.clearedReceipt.day <= scenario.essentials.dueDay;
    const secondUnlocked = reasons.length === 0 && receiptConfirmed && fresh('balance') && liabilitiesResolved && input.refreshedFunds !== null && safeForRemainder >= secondSpend;
    const diagnostics: SafeToBuyDiagnostics = {
      reserve, availableNow: safeNow, starterSpend: firstSpend, firstBalance, remainder,
      starterExpectedSurplus: firstExpected, remainderExpectedSurplus: secondExpected, receiptConfirmed,
      remainingReserve, liabilitiesResolved, currentFunds, availableForRemainder: safeForRemainder, remainderSpend: secondSpend, secondUnlocked,
    };
    if (reasons.length) return finish({ ...meta, status: 'blocked', diagnostics, explanations: reasons });
    const starterPlan: ModelledPurchase = { stockCost: starter, deliveryFee: terms.firstDeliveryFee, reservedFunds: reserve, availableAfterReserve: nonNegativeCents(safeNow), expectedSalesSurplus: firstExpected };
    const lockReasons: Explanation[] = [];
    if (!liabilitiesResolved) lockReasons.push(explanation('UNRESOLVED_LIABILITY'));
    if (Object.values(input.confirmations).some(value => value !== null && value.revision !== input.inputRevision)) lockReasons.push(explanation('STALE_INPUT'));
    if (!receiptConfirmed || !fresh('balance') || !fresh('liabilities')) lockReasons.push(explanation('CONFIRMATION_REQUIRED'));
    if (safeForRemainder < secondSpend) lockReasons.push(explanation('INSUFFICIENT_CLEARED_FUNDS'));
    const later: LaterBatch = secondUnlocked
      ? { status: 'modelled-feasible', purchase: { stockCost: remainder, deliveryFee: terms.secondDeliveryFee, reservedFunds: remainingReserve, availableAfterReserve: nonNegativeCents(safeForRemainder), expectedSalesSurplus: secondExpected } }
      : { status: 'locked', explanations: lockReasons };
    return finish({ ...meta, status: 'modelled-feasible', starter: starterPlan, later, diagnostics, explanations: [explanation('MODELLED_FEASIBLE')] });
  } catch (error) {
    if (error instanceof MoneyError) return failure(error.code);
    throw error;
  }
}
