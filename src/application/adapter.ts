import { parseMoney, toMoneyText } from '../engine/money/index';
import { validateScenario, deepFreeze } from '../engine/validation/index';
import type { ValidationCode, ValidationIssue, ValidationResult, ValidatedScenario } from '../engine/validation/index';
import { compareValidatedScenario } from '../engine/comparison/index';
import type { DecisionComparison } from '../engine/comparison/index';
import { planSafeToBuy, reportedReceiptDay } from '../engine/safe-to-buy/index';
import type { SafeToBuyPlan, OriginalBillState, SupplierTerms } from '../engine/safe-to-buy/index';
import type { ConfirmationSet, Revision } from '../engine/state/index';
import type { ReasonCode } from '../engine/explanations/index';
import { STRATEGY_LABELS } from '../engine/simulation/index';
import type { FinancialEvent } from '../engine/simulation/index';
export { STRATEGY_LABELS };
export type { DecisionComparison, SafeToBuyPlan };
export const scenarioFields = ['cash','bank','receivable','receiptDay','bill1','bill2','dueDay','stockCost','grossSales','salesLagDays','emergencyAmount','emergencyDay','receiptProbability','salesProbability'] as const;
export type ScenarioField = typeof scenarioFields[number] | 'receiptTiming' | 'billPriority' | 'relation';
export type Draft = Readonly<Record<ScenarioField, string>>;
export const emptyDraft: Draft = deepFreeze({ ...Object.fromEntries(scenarioFields.map(k => [k,''])), receiptTiming:'known',billPriority:'first',relation:'independent' } as Record<ScenarioField,string>);
export const exampleDraft: Draft = deepFreeze({cash:'600',bank:'0',receivable:'300',receiptTiming:'known',receiptDay:'2',bill1:'500',bill2:'0',dueDay:'3',billPriority:'first',stockCost:'250',grossSales:'400',salesLagDays:'2',emergencyAmount:'0',emergencyDay:'3',receiptProbability:'0.75',salesProbability:'0.75',relation:'independent'});
export const safeMoneyFields = ['minimumBatch','increment','firstDeliveryFee','secondDeliveryFee','starterCost','starterGrossSalesEstimate','remainderGrossSalesEstimate','buffer','receiptAmount','clearedBalance','remainingOtherBills','remainingEmergency','bill1Paid','bill1Outstanding','bill2Paid','bill2Outstanding'] as const;
export type SafeField = typeof safeMoneyFields[number] | 'splitAcceptance' | 'receiptDayReported' | 'receiptReported' | 'balanceReported' | 'bill1Status' | 'bill2Status';
export type SafeDraft = Readonly<Record<SafeField,string>>;
export const emptySafe: SafeDraft = deepFreeze({...Object.fromEntries(safeMoneyFields.map(k=>[k,''])),splitAcceptance:'unreported',receiptDayReported:'',receiptReported:'no',balanceReported:'no',bill1Status:'unresolved',bill2Status:'unresolved'} as Record<SafeField,string>);
export const exampleSafe: SafeDraft = deepFreeze({minimumBatch:'50',increment:'50',firstDeliveryFee:'0',secondDeliveryFee:'0',starterCost:'100',starterGrossSalesEstimate:'160',remainderGrossSalesEstimate:'240',buffer:'0',receiptAmount:'300',receiptDayReported:'2',clearedBalance:'350',remainingOtherBills:'0',remainingEmergency:'0',bill1Paid:'300',bill1Outstanding:'200',bill2Paid:'0',bill2Outstanding:'0',splitAcceptance:'accepted',receiptReported:'yes',balanceReported:'yes',bill1Status:'partial',bill2Status:'unresolved'});
export interface Snapshot { readonly scenario: ValidatedScenario; readonly comparison: DecisionComparison; readonly draft: Draft }
export function compareDraft(d: Draft): ValidationResult<Snapshot> {
  const scenario = validateScenario({cash:d.cash,bank:d.bank,receivable:d.receivable,receiptTiming:d.receiptTiming==='unknown'?{kind:'unknown'}:{kind:'known',day:d.receiptDay},bills:[{id:'bill-1',amount:d.bill1},{id:'bill-2',amount:d.bill2}],dueDay:d.dueDay,billPriority:d.billPriority as 'first'|'second',stockCost:d.stockCost,grossSales:d.grossSales,salesLagDays:d.salesLagDays,emergency:{amount:d.emergencyAmount,day:d.emergencyDay},probability:{receipt:d.receiptProbability,sales:d.salesProbability,relation:d.relation}});
  if (!scenario.ok) return scenario;
  const result=compareValidatedScenario(scenario.value);
  return result.ok ? deepFreeze({ok:true,value:{scenario:scenario.value,comparison:result.value,draft:{...d}}}) : result;
}
export function safeDraft(draft: Draft, d: SafeDraft, revision: Revision, confirmations: ConfirmationSet): ValidationResult<SafeToBuyPlan> {
  const scenario=compareDraft(draft); if (!scenario.ok) return scenario;
  const issues: ValidationIssue[]=[];
  const money=(key:typeof safeMoneyFields[number])=>{
    const result=parseMoney(d[key]);
    if (!result.ok) issues.push({code:d[key].trim()===''?'INCOMPLETE_INPUT':result.issues[0].code,path:[key],messageKey:'validation.money'});
    return result.ok ? result.value : 0 as import('../engine/money/index').InputCents;
  };
  const terms={source:'user-reported',independentlyVerified:false,splitAcceptance:d.splitAcceptance as SupplierTerms['splitAcceptance'],minimumBatch:money('minimumBatch'),increment:money('increment'),firstDeliveryFee:money('firstDeliveryFee'),secondDeliveryFee:money('secondDeliveryFee')} as const;
  const starterCost=money('starterCost'), starterGrossSalesEstimate=money('starterGrossSalesEstimate'), remainderGrossSalesEstimate=money('remainderGrossSalesEstimate'), buffer=money('buffer');
  const bills: OriginalBillState[] = (['bill-1','bill-2'] as const).map((id,index)=>{
    const bill=scenario.value.scenario.essentials.bills.find(b=>b.id===id);
    const key=index===0?'bill1':'bill2', status=d[`${key}Status`];
    if (!bill || bill.amount===0) {
      if(status!=='unresolved') {
        const outstanding=money(`${key}Outstanding`);
        if(outstanding!==0) issues.push({code:'CONTRADICTORY_CONFIRMATION',path:[`${key}Outstanding`],messageKey:'validation.liability'});
        if(status==='partial' && money(`${key}Paid`)!==0) issues.push({code:'CONTRADICTORY_CONFIRMATION',path:[`${key}Paid`],messageKey:'validation.liability'});
      }
      return {status:'none',billId:id};
    }
    if (status==='unresolved') return {status,bill};
    const outstanding=money(`${key}Outstanding`);
    if(status==='partial') return {status,bill,outstanding:outstanding as import('../engine/money/index').NonNegativeCents,paidAmount:money(`${key}Paid`)};
    return {status:status as 'paid'|'unpaid',bill,outstanding:outstanding as import('../engine/money/index').NonNegativeCents};
  });
  let clearedReceipt=null;
  if(d.receiptReported==='yes') {
    const amount=money('receiptAmount');
    const day=reportedReceiptDay(d.receiptDayReported.trim()===''?NaN:Number(d.receiptDayReported));
    if(!day.ok) issues.push({code:'INVALID_DAY',path:['receiptDayReported'],messageKey:'validation.day'});
    if(day.ok) clearedReceipt={source:'user-reported',independentlyVerified:false,status:'reported-cleared',amount,day:day.value} as const;
  }
  const refreshedFunds=d.balanceReported==='yes'?{source:'user-reported',independentlyVerified:false,clearedBalance:money('clearedBalance'),remainingOtherBills:money('remainingOtherBills'),remainingEmergency:money('remainingEmergency')} as const:null;
  if(issues.length) return deepFreeze({ok:false,issues:issues as [ValidationIssue,...ValidationIssue[]]});
  return planSafeToBuy({inputRevision:revision,scenario:scenario.value.scenario,supplier:terms,starterCost,starterGrossSalesEstimate,remainderGrossSalesEstimate,buffer,originalBills:bills as [OriginalBillState,OriginalBillState],clearedReceipt,refreshedFunds,confirmations});
}
export const errorCopy: Readonly<Record<ValidationCode,string>>={MALFORMED_MONEY:'Enter a decimal rand amount, without currency symbols or separators.',UNSUPPORTED_PRECISION:'Use at most two decimal places. Fractional cents are not rounded.',NEGATIVE_MONEY:'Enter zero or a positive amount.',INPUT_MONEY_LIMIT:'Each amount must be at most R10,000,000.',AGGREGATE_LIMIT:'The combined calculation exceeds the R1 billion limit.',INVALID_DAY:'Use a whole day from 1 to 14.',INVALID_PROBABILITY:'Enter a probability from 0 to 1, for example 0.75.',INVALID_JOINT_PROBABILITY:'These probability assumptions cannot form a supported distribution.',INCOMPLETE_INPUT:'Complete this input. Enter 0 only if the amount really is zero.',CONTRADICTORY_CONFIRMATION:'The reported payment, outstanding amount or confirmation contradicts the financial inputs.',UNSUPPORTED_SCENARIO:'This scenario is outside the supported R51 model.'};
const fieldPaths: Record<string,string>={'bills.0.amount':'bill1','bills.1.amount':'bill2','receiptTiming.day':'receiptDay','emergency.amount':'emergencyAmount','emergency.day':'emergencyDay','probability.receipt':'receiptProbability','probability.sales':'salesProbability','probability.relation':'relation','clearedReceipt':'receiptReported','clearedReceipt.day':'receiptDayReported','refreshedFunds':'balanceReported','originalBills.0':'bill1Status','originalBills.1':'bill2Status','originalBills.0.outstanding':'bill1Outstanding','originalBills.1.outstanding':'bill2Outstanding','originalBills.0.paidAmount':'bill1Paid','originalBills.1.paidAmount':'bill2Paid'};
export function errorsFor(issues:readonly ValidationIssue[]): Readonly<Record<string,string>> { return Object.fromEntries(issues.map(i=>[fieldPaths[i.path.join('.')]??i.path.join('.'),i.code==='INVALID_DAY' && ['receiptDayReported','clearedReceipt.day'].includes(i.path.join('.'))?'Use a whole reported receipt day of 0 or later.':errorCopy[i.code]])); }
const reasonCopy:Record<ReasonCode,string>={EXPECTED_RECEIPT_NOT_CLEARED:'Expected receipts are not cleared funds.',UNKNOWN_RECEIPT_DATE:'The receipt date is unknown, so the receipt is excluded from simulated cash.',ESSENTIAL_SHORTFALL:'At least one modelled path leaves an essential bill unpaid.',EMERGENCY_SHORTFALL:'At least one modelled path leaves emergency expenses unpaid, separately from essential risk.',PURCHASE_NOT_EXECUTED:'A purchase is not executed in this path.',SUPPLIER_SPLIT_NOT_ACCEPTED:'Supplier acceptance of split orders must be reported.',SUPPLIER_MINIMUM:'A batch is below the supplier minimum.',SUPPLIER_INCREMENT:'A batch does not match the supplier increment.',INSUFFICIENT_CLEARED_FUNDS:'Reported cleared funds do not cover the purchase and required reserves.',UNRESOLVED_LIABILITY:'Resolve original bills and confirm the current liability record before the later batch.',CONFIRMATION_REQUIRED:'Current receipt, balance and liability reports are required for the later batch.',STALE_INPUT:'A confirmation belongs to an earlier revision. Confirm the refreshed inputs again.',SALES_ESTIMATE_INSUFFICIENT:'Modelled gross sales less stock and fees must be positive for each batch; this is not profit.',MODELLED_FEASIBLE:'The reported assumptions meet the modelled constraints. This is not a recommendation or payment.',OUTSIDE_HORIZON:'This event is outside the simulation horizon.',INVALID_ORDER:'The starter order must be positive and smaller than the full stock order.'};
export function describeReason(code:ReasonCode):string {return reasonCopy[code];}
export function moneyText(cents:Parameters<typeof toMoneyText>[0]):string {return 'R'+toMoneyText(cents);}
export function eventText(event:FinancialEvent):string {
  switch(event.kind){
    case 'receipt-cleared':return `Assumed receipt arrives: ${moneyText(event.amount)}. Not independently verified.`;
    case 'stock-purchased':return `Modelled stock purchase: ${moneyText(event.cost)}.`;
    case 'sales-received':return `Assumed gross sales received (not profit): ${moneyText(event.amount)}.`;
    case 'essential-payment':return `${event.billId}: due ${moneyText(event.due)}, paid ${moneyText(event.paid)}, unpaid ${moneyText(event.unpaid)}.`;
    case 'emergency-payment':return `Emergency: due ${moneyText(event.due)}, paid ${moneyText(event.paid)}, unpaid ${moneyText(event.unpaid)}.`;
    case 'purchase-not-executed':return `Purchase not executed: ${moneyText(event.available)} available; ${moneyText(event.required)} required.`;
    case 'horizon-closed':return `Model closes: balance ${moneyText(event.balance)}. Unpaid obligations remain outstanding.`;
  }
}
export function pathLabel(outcome:DecisionComparison['strategies']['now']['outcomes'][number]):string {return `Receipt ${outcome.assumedEvents.receiptArrives?'arrives':'does not arrive'}; sales ${outcome.assumedEvents.salesSucceed?'succeed':'do not succeed'} (${(outcome.probabilityWeight*100).toFixed(2)}% modelled weight)`;}