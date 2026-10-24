# Revision state contracts — Sprint 3 integration

The pure revision functions originated in Sprint 1. Sprint 3 implements the application event protocol and session isolation described below.

## State and transitions

DecisionState<T> is dirty with no result, or current with Revisioned<T>. inputRevision is a branded nonnegative safe integer. Receipt, balance and liabilities each carry a nullable user attestation. There is no bank-verified variant.

createDecisionState starts dirty at revision zero. financialInputChanged increments the revision and synchronously drops the result and every confirmation. It must be used for any relevant amount, date, probability, liability status, partial payment, reserve, supplier term or receipt/balance snapshot edit. The conservative all-confirmations invalidation is a proposed contract policy; R51's DOM listeners have their own historical tracked field list.

acceptResult accepts only an envelope carrying the current input revision. A result started before an edit is rejected with STALE_RESULT and leaves the edited state unchanged. currentResult independently checks revision equality, so even a forged stale current envelope is hidden.

confirmUserReport accepts only the current captured revision and creates source=user-reported, independentlyVerified=false. Stale submission returns STALE_CONFIRMATION. confirmationsAreCurrent requires all three attestations at the current revision. It is not a financial feasibility or truth check.

Examples: result revision 0 + input edit -> dirty revision 1, null result, null confirmations. Later completion of result 0 -> rejection. Result 1 may then be accepted. A confirmation from revision 0 cannot unlock anything at revision 1.

## Immutability and limits

Transition envelopes, revisioned result envelopes and confirmation records are frozen. Domain payloads use readonly contracts; arbitrary payloads are not recursively cloned or frozen. The application adapter supplies immutable snapshots and does not mutate them through outside aliases. Type assertions and JavaScript callers can bypass TypeScript; future boundary validation remains necessary.

Revisions belong to one decision session. Async work from a discarded session must not be delivered to another fresh session just because both began at revision zero; session routing is the future host's responsibility. Revision exhaustion fails closed with RangeError before unsafe increment; a fresh session requires discarding prior in-flight work.

No comparison, financial parser or Safe-to-Buy engine is run by these transitions. No statement that confirmations are current proves funds cleared or liabilities were paid. Core transition tests alone do not certify host behavior; Sprint 3 separately tests the implemented UI/engine integration below.

## Tests

State tests cover initial dirty state; matching result publication; immediate clearing of result and all confirmations; old-result and old-confirmation rejection; complete user-reported confirmations; repeated changes; defensive stale-envelope reading; invalid revisions and safe-integer exhaustion. They test actual state runtime only. Contract/type tests cover readonly fields and the impossibility of assigning true to independentlyVerified without escaping the type system.

## Sprint 2 integration boundary

Financial comparison and Safe-to-Buy APIs now return immutable modelled results or structured failures. A pure integration test publishes a real comparison, increments the revision on an edit, submits an invalid new draft and confirms that the old decision stays hidden; a late result remains rejected. Safe-to-Buy also checks current receipt/balance/liability attestation revisions.

Sprint 2 itself did not add UI event wiring. Sprint 3 now calls financialInputChanged on every relevant edit and isolates sessions. Revision consistency cannot prove a real-world payment or automatically detect an edit made outside that protocol.

## Sprint 3 implemented application transitions

The earlier descriptions of missing UI wiring are historical Sprint 1/2 scope. The React host now dispatches financialInputChanged for every financial scenario and Safe-to-Buy edit. Results and all three confirmations disappear in that transition, before validation/recalculation. Invalid submissions cannot restore the old result. A Safe-to-Buy confirmation toggle clears the staged plan and any pending request; it does not change unrelated scenario assumptions.

Session Symbols isolate separate decisions. Completion tickets additionally carry revision and a unique request identity, rejecting superseded work at the same revision. Confirmation events carry their originating session and revision; queued old confirmation events cannot attest new input. Input events from discarded sessions are ignored. Reset starts blank and clears all results, confirmations and in-flight routing. Runtime failures fail closed, show an error and expose no previous comparison as a current decision. Financial snapshots are deeply frozen by the adapter/engine, including copied raw draft strings. These tokens are local routing metadata, never bank verification.

Pure routing tests exercise late results, same-revision supersession, revision-zero cross-session collisions, stale confirmations, discarded-session edits and failure behavior. Rendered React tests exercise actual form handlers, field errors/focus and immediate clearing. Built-application browser tests independently exercise DOM changes, confirmation clearing and a delayed completion across reset. This verifies the tested host protocol, not every possible browser interaction or real-world truth of reports.