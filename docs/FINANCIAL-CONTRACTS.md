# Implemented financial contracts — Sprint 3 integration

## Exact money and precision

Canonical money is a branded safe integer number of cents. parseMoney reads decimal digits through BigInt and converts only after the R10,000,000 individual limit (1,000,000,000 cents) passes. It accepts R51 positive syntax including .30, leading zeroes and surrounding whitespace. It rejects negative syntax (including -0), exponential notation, malformed entries and more than two fractional digits. Nothing malformed is silently rounded.

checkedCents checks safe-integer status and the +/-100,000,000,000-cent aggregate/intermediate bound. addCents, subtractCents and sumCents validate operands and every intermediate. inputCents enforces nonnegative individual inputs. toRand is a display/reference conversion only; toMoneyText emits exact signed decimal text. No financial path uses floating rand values.

Expected monetary values use separate numeric probability weights. Products and accumulated weighted intermediates are checked for finiteness and bounds; rounding happens only at R51-compatible output boundaries via Math.round. Negative half-cent rounding retains JavaScript's direction toward positive infinity, including signed zero.

**Retained numerical limitation:** 50 cents * .29 is exactly 14.5 cents as a decimal rational, but R51's binary product is just below 14.5 and rounds to 14. This engine deliberately matches that observable result. An independent BigInt/rational test records mathematical 15 versus retained R51 14. Exact path arithmetic is established separately; parity does not establish exact rational expected-value accuracy. Changing this requires an approved policy/correction, not a hidden epsilon.

## Validated scenarios

Raw money/probability/day fields are text. Probability drafts use 0..1 rates, not UI percentages; the application form explicitly uses the same 0..1 rate units. Numeric day/probability parsing retains R51's finite Number semantics, with integer/range checks for days. Money parsing is deliberately stricter than numeric probability parsing.

validateScenario returns a structured failure with nonempty issues or a deeply frozen owned ValidatedScenario. It validates all money, days 1..14, receipt known/unknown timing, bill IDs/count/priority, duplicate IDs, a shared due day, independent/linked mode and probability bounds. Unsupported correlations and horizons are rejected. Expected receipts remain expected-not-cleared, separate from opening cleared cash/bank funds.

A runtime WeakSet identity check prevents ordinary public simulation/comparison APIs from accepting merely cast or cloned unvalidated scenarios. No bank verification is implied; every scenario source is user-reported and independentlyVerified=false.

## Probability and timing

Independent joint success is p*q. Linked success is min(p,q). The four weights retain source order: both, receipt-only, sales-only, neither. Unknown receipt dates force effective receipt probability to zero without inventing a date. R51's negative-neither tolerance -1e-9, clamp and omission of weights <=1e-10 are retained; discarded tiny paths are not renormalized. Total-weight checks allow that bounded omission. This is an assumption-driven model, not trained ML.

Input days and sales lags are 1..14. Simulation runs through Day 30. Buy now attempts once at Day 0. Wait attempts once on dueDay+1; Day 15 purchases and Day 29 sales are reachable. No valid current scenario can schedule a purchase-linked sale on Day 30 or later; tests cover closing on Day 30 and reject unsupported input days rather than invent a broader scenario. A horizon-closed event is new diagnostic metadata, not an extra financial transaction.

Same-day order: receipt, prioritized essential bills, emergency, eligible wait/trigger purchase, sales. Sales arriving that day do not retroactively pay a bill already processed. Trigger requires a receipt, no earlier unpaid essential/emergency amount and funds for stock plus remaining protected bills/emergencies. Initial unaffordable purchases are never retried.

**Retained business limitation:** Wait is a timing strategy, not a guarantee of bill protection. It may buy after a missed bill if later cash is available. Unpaid liabilities remain visible; no automatic recommendation is made.

## Results and exposure

Every comparison, strategy result, simulation outcome and Safe-to-Buy plan is labelled modelled-not-advice, user-reported and independentlyVerified=false. Outcomes contain exact cents, purchase/sales timing, explicit per-bill and emergency liabilities, ordered events and Day 30 closure.

Risk is the rounded percentage of essential-shortfall paths. Unpaid emergency amounts are separate and still contribute to expected unpaid/net exposure. Expected end balance, shortfall, individual bills, combined unpaid, net after liabilities, purchase/sales chances and purchase timing follow R51. No explanation component, bank data or UI renderer enters calculation.

## Safe-to-Buy

Supplier split acceptance, minimum, increment, fees and simplified gross-sales estimates are validated. Zero increment means no fixed-step constraint, matching R51. A positive starter must be smaller than total stock cost; both batches must satisfy supplier rules and have positive rounded modelled sales surplus. Sales surplus is not profit.

Starter reserve uses original scenario bills, emergency and buffer, even if a later refreshed bill status says paid; this historical distinction is preserved. Later reserve uses reconciled outstanding bills, refreshed other bills/emergency and buffer. Paid means zero outstanding; unpaid means the original amount; partial requires 0 < paid < original and exactly original-paid outstanding; unresolved locks the later batch. Contradictory no-bill/paid/outstanding entries are structured errors.

ReportedReceiptDay replaces the too-narrow Sprint 1 Day type: R51 permits Day 0 and later reported offsets, while unlocking requires a positive reported receipt with day <= the shared due day. Nonnegative safe integer reported offsets are accepted; late Day 3/30 values lock without broadening scenario input days. Fractional/negative/nonfinite dates are rejected.

Receipt, balance and liability attestations must match inputRevision and explicitly remain user-reported, never independently verified. Stale attestations lock; a current attestation with a missing underlying receipt/balance snapshot is contradictory. Refreshed funds already include the receipt and are never increased by adding it again. All returned records are immutable; blocked plans never expose an unlocked later batch.

## Contract evolution and limits

Sprint 1's proposed function aliases now return structured results. Simulation accepts ValidatedScenario; comparison starts from ScenarioDraft rather than accepting arbitrary precomputed outcomes. Safe planning checks cent-denominated inputs at runtime. New result provenance, diagnostics and closure metadata are contract corrections, not changes to historical monetary decisions.

Ordinary input failures carry validation codes/paths, not raw values or generic exceptions. Type assertions and hostile JavaScript getters/proxies remain outside a comprehensive security guarantee. Raw supplier-draft/UI adaptation and cross-session routing are implemented below. Real-world verification, exact rational expected-value policy and production assurance remain future work.

## Sprint 3 implemented host boundary

The previously proposed raw-draft adapter is now implemented in src/application/adapter.ts. Forms use decimal money text and explicit 0..1 probability rates. Blank amounts fail; the interface never treats blank as zero. The only filled example is explicitly user-loaded and labelled illustrative, with confirmations initially unchecked. Receipt timing has known/unknown modes and unknown mode does not invent a day. Two essential bills retain the R51 shared due date and explicit priority.

Supplier and staged-purchase text crosses parseMoney before the engine. Partial payments require separately entered paid and outstanding amounts; the engine checks original minus paid exactly. Contradictions against zero original bills are rejected at the adapter instead of silently dropping a reported payment. Reported receipt/balance snapshots are optional and explicit; a missing report cannot acquire a confirmation through ordinary UI controls. All confirmations remain user-reported and independentlyVerified=false. The refreshed balance already includes the receipt and is passed unchanged.

Cards display engine risk, essential shortfall, combined unpaid exposure, per-bill unpaid amounts, ending cash, net after unpaid and purchasing likelihood. Money Map lists actual engine events from one selectable outcome with its modelled probability weight, starting reported cleared funds and separate essential/emergency unpaid amounts. This path is hypothetical, not a prediction. Weighted averages are not described as a guaranteed path. Diagnostic staged amounts come directly from planSafeToBuy. The UI repeats the retained wait-with-unpaid-bills, unknown receipt exclusion and rounding limitations. No engine policy changed in Sprint 3.