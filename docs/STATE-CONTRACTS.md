# Revision state contracts — Sprint 1

This sprint implements pure revision rules only, with no UI event wiring or recalculation behavior.

## State and transitions

DecisionState<T> is dirty with no result, or current with Revisioned<T>. inputRevision is a branded nonnegative safe integer. Receipt, balance and liabilities each carry a nullable user attestation. There is no bank-verified variant.

createDecisionState starts dirty at revision zero. financialInputChanged increments the revision and synchronously drops the result and every confirmation. It must be used for any relevant amount, date, probability, liability status, partial payment, reserve, supplier term or receipt/balance snapshot edit. The conservative all-confirmations invalidation is a proposed contract policy; R51's DOM listeners have their own historical tracked field list.

acceptResult accepts only an envelope carrying the current input revision. A result started before an edit is rejected with STALE_RESULT and leaves the edited state unchanged. currentResult independently checks revision equality, so even a forged stale current envelope is hidden.

confirmUserReport accepts only the current captured revision and creates source=user-reported, independentlyVerified=false. Stale submission returns STALE_CONFIRMATION. confirmationsAreCurrent requires all three attestations at the current revision. It is not a financial feasibility or truth check.

Examples: result revision 0 + input edit -> dirty revision 1, null result, null confirmations. Later completion of result 0 -> rejection. Result 1 may then be accepted. A confirmation from revision 0 cannot unlock anything at revision 1.

## Immutability and limits

Transition envelopes, revisioned result envelopes and confirmation records are frozen. Domain payloads use readonly contracts; arbitrary payloads are not recursively cloned or frozen. Future integration must supply immutable snapshots and must not mutate them through outside aliases. Type assertions and JavaScript callers can bypass TypeScript; future boundary validation remains necessary.

Revisions belong to one decision session. Async work from a discarded session must not be delivered to another fresh session just because both began at revision zero; session routing is the future host's responsibility. Revision exhaustion fails closed with RangeError before unsafe increment; a fresh session requires discarding prior in-flight work.

No comparison, financial parser or Safe-to-Buy engine is run by these transitions. No statement that confirmations are current proves funds cleared or liabilities were paid. These rules do not certify end-to-end stale-result prevention until future UI/engine integration is separately tested.

## Tests

State tests cover initial dirty state; matching result publication; immediate clearing of result and all confirmations; old-result and old-confirmation rejection; complete user-reported confirmations; repeated changes; defensive stale-envelope reading; invalid revisions and safe-integer exhaustion. They test actual state runtime only. Contract/type tests cover readonly fields and the impossibility of assigning true to independentlyVerified without escaping the type system.
