import { createDecisionState, financialInputChanged, acceptResult, confirmUserReport, currentResult } from '../engine/state/index';
import type { DecisionState, Revision, ConfirmationKind } from '../engine/state/index';
import type { ValidationIssue, ValidationResult } from '../engine/validation/index';
import { deepFreeze } from '../engine/validation/index';
import { emptyDraft, emptySafe } from './adapter';
import type { Draft, SafeDraft, Snapshot, SafeToBuyPlan } from './adapter';
export interface Ticket { readonly session:symbol; readonly revision:Revision; readonly kind:'comparison'|'safe'; readonly request:symbol }
export interface Session {
  readonly id:symbol; readonly draft:Draft; readonly safeDraft:SafeDraft; readonly decision:DecisionState<Snapshot>;
  readonly plan:SafeToBuyPlan|null; readonly pending:Ticket|null; readonly issues:readonly ValidationIssue[]; readonly failure:string|null;
}
export function newSession():Session {return deepFreeze({id:Symbol('decision-session'),draft:emptyDraft,safeDraft:emptySafe,decision:createDecisionState<Snapshot>(),plan:null,pending:null,issues:[],failure:null});}
export function ticketFor(state:Session,kind:Ticket['kind']):Ticket {return Object.freeze({session:state.id,revision:state.decision.inputRevision,kind,request:Symbol('request')});}
export type Action =
 | {type:'edit';session:symbol;draft:Draft;safeDraft:SafeDraft}
 | {type:'reset'}
 | {type:'confirm';session:symbol;revision:Revision;kind:ConfirmationKind;checked:boolean}
 | {type:'begin';ticket:Ticket}
 | {type:'complete';ticket:Ticket;result:ValidationResult<Snapshot>|ValidationResult<SafeToBuyPlan>}
 | {type:'failure';ticket:Ticket};
function matches(s:Session,t:Ticket):boolean {return s.id===t.session && s.decision.inputRevision===t.revision;}
export function sessionReducer(s:Session,a:Action):Session {
  if(a.type==='reset') return newSession();
  if(a.type==='edit' && a.session!==s.id) return s;
  if(a.type==='edit') return deepFreeze({...s,draft:{...a.draft},safeDraft:{...a.safeDraft},decision:financialInputChanged(s.decision),plan:null,pending:null,issues:[],failure:null});
  if(a.type==='confirm') {
    if(a.session!==s.id || a.revision!==s.decision.inputRevision) return s;
    const transition=confirmUserReport(s.decision,a.kind,a.revision);
    const decision=a.checked?transition.state:Object.freeze({...s.decision,confirmations:Object.freeze({...s.decision.confirmations,[a.kind]:null})});
    return deepFreeze({...s,decision,plan:null,pending:null,issues:[],failure:null});
  }
  if(a.type==='begin') return matches(s,a.ticket)?deepFreeze({...s,pending:a.ticket,plan:null,issues:[],failure:null}):s;
  if(!matches(s,a.ticket)||s.pending!==a.ticket) return s;
  if(a.type==='failure') return deepFreeze({...s,pending:null,plan:null,decision:clearResult(s.decision),failure:'Your numbers are still here. Please try again. If it keeps happening, review your inputs.'});
  if(!a.result.ok) return deepFreeze({...s,pending:null,plan:null,decision:a.ticket.kind==='comparison'?clearResult(s.decision):s.decision,issues:a.result.issues});
  if(a.ticket.kind==='safe') return deepFreeze({...s,pending:null,plan:a.result.value as SafeToBuyPlan});
  const accepted=acceptResult(s.decision,{revision:a.ticket.revision,value:a.result.value as Snapshot});
  return deepFreeze({...s,pending:null,decision:accepted.state});
}
function clearResult(s:DecisionState<Snapshot>):DecisionState<Snapshot> {return Object.freeze({...s,status:'dirty',result:null});}
export function visibleSnapshot(s:Session):Snapshot|null {return currentResult(s.decision);}
export type { ConfirmationKind };