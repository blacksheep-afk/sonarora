# Financial contracts — Sprint 1

All records and collections are readonly. This is compile-time immutability, not automatic runtime validation. No parser, financial validator, distribution builder, simulator, comparison aggregator or staged-purchase calculator is implemented.

## Money, uncertainty and timing

Cents is a nominal number representing a safe integer count of cents, never a floating-point rand amount. NonNegativeCents narrows nonnegative quantities. InputCents narrows nonnegative entered amounts to the recorded R51 limit: 1,000,000,000 cents (R10,000,000). Signed intermediate/path amounts must remain within +/-100,000,000,000 cents (R1,000,000,000). ExpectedCents represents output-rounded weighted monetary results and is separate from entered/path cents. Expected calculations may involve numeric weights in future but round at the output boundary, matching R51.

Brands are opaque compile-time distinctions. They do not validate arbitrary casts or JavaScript callers. Future decimal-text parsing must reject negatives, exponent notation, malformed entries and more than two fractional digits without implicit rounding; future arithmetic must guard every intermediate bound. Ordinary numbers cannot be assigned to money; probabilities cannot be assigned to money.

Probability is a validated finite 0..1 weight. DisplayPercent is an R51-style rounded display percentage, not a weight. For independent outcomes joint success is p*q; for linked outcomes it is min(p,q). The four path weights are joint, p-joint, q-joint and 1-p-q+joint, with the same omission/tolerance behavior as the reference to be verified during migration. No arbitrary linked joint probability is accepted by this contract. Unknown receipt dates force the effective receipt weight to zero in future implementations, without inventing a date.

Day is a validated input day 1..14 and narrows SimulationDay (1..30). EventDay additionally permits Day 0 for initial purchases. The horizon is exactly 30, as the preserved run loop demonstrates. A wait purchase can occur on Day 15 and sales on Day 29. Receipt timing is known(day) or unknown. Two essential bills share a due day and have first/second payment priority, preserving R51; distinct per-bill due days are unsupported rather than silently added.

## Scenario and results

OpeningFunds contains only reported cleared cash and bank funds. ExpectedReceipt has expected-not-cleared status and must never be added to opening cleared funds. EssentialObligations contains zero, one or two bills. StockAndSales separates cost, gross-sales estimate and sales lag. EmergencyExpense records amount and day. All sources are user-reported and independentlyVerified is always false.

Strategy IDs remain now, wait and trigger, labelled Buy now, Protect the bill first, and Purchase conditionally after receipt. R51 buys now at Day 0, considers wait after the essential due day, and conditionally buys after a receipt with protected essentials/emergencies and sufficient funds. Same-day receipt events precede obligations. Unaffordable initial purchases are not silently retried. Sales exist only after stock purchase and count only when received. Sprint 1 implements none of these calculations.

SimulationOutcome separates probabilityWeight from cents, records purchase/sales timing, opening/end balances, signed net after unpaid amounts, essential/emergency unpaid amounts, per-bill unpaid balances and ordered event records. The future engine must ensure bill-ID uniqueness, event order, consistency of totals and supported limits; TypeScript shapes alone cannot prove them.

DecisionComparison requires all three strategies, modelled essential-shortfall risk percentages (emergency unpaid is separate), expected monetary shortfall/end/unpaid/net values, purchase/sales chances, timing and explanations. It is labelled modelled-not-advice. There is no ranking algorithm, verified forecast or lending decision.

## Safe-to-Buy

Supplier terms explicitly record user-reported acceptance, minimum batch, increment and two delivery fees. OriginalBillState discriminates none, unresolved, unpaid, partial and paid. Partial records retain paid amount and outstanding balance; unpaid reserves the full amount, paid reserves zero, and unresolved must lock the later purchase. These arithmetic consistency rules are documented obligations of future validation, not guarantees established by interfaces.

ReportedClearedReceipt is distinct from ExpectedReceipt and carries an amount and day. RefreshedFunds is the user's current cleared balance, already including that receipt. It must never be increased by adding the receipt again. Remaining bills, remaining emergencies and buffer are explicit. The attached FinancialScenario supplies opening funds, total stock cost, dates, sales probability and the initial emergency amount. The starter emergency reserve and refreshed remaining emergency belong to different stages; they must not be added together indiscriminately. Conflicting entries, stale confirmations and missing snapshots must not produce a usable plan.

SafeToBuyPlan has incomplete, blocked, locked and modelled-feasible variants. A feasible starter can coexist with a locked later batch. These are proposed normalized statuses, not a change to R51's internal off/blocked/feasible result strings. A feasible model is not supplier approval, bank verification, a purchase instruction or profit. expectedSalesSurplus remains the simplified gross-sales estimate less stock/fees, not profit.

## Validation and explanations

ValidationResult is either ok(value) or failure(nonempty structured issues), never both. Codes cover malformed money, unsupported precision, negative money, input/aggregate bounds, invalid day/probability/joint assumptions, incomplete input, contradictory confirmations and unsupported scenarios. Paths and message keys remain separate from components. No Zod schema or financial validation function is implemented in Sprint 1.

Explanation reason codes are domain identifiers. Facts distinguish money, probabilities, day values and labels; caveats identify user-reported/hypothetical assumptions and sales-surplus/payment limits. React presentation and translation are future consumers, not dependencies. Explanation/result consistency must be tested alongside the future engine; a type definition cannot prove it.

## Open questions before migration

Review whether branded numeric cents should remain the public representation or use BigInt internally while preserving R51 outputs. Confirm the raw-draft adapter for decimal probabilities and legacy field names, the exact output-rounding/tolerance rules, and R51's chronological event ordering. Decide how future runtime validation and immutable snapshots will be enforced at untrusted boundaries. Arbitrary correlations, separate bill due dates, multiple expected receipts and longer horizons remain unsupported.

Direct inspection corrected the old handover's ambiguous 14-day description: 1..14 constrains inputs, while run() iterates through Day 30. The source also exposes same-day bill priority and counts only essential shortfalls in displayed risk. These are preserved historical rules, not newly introduced calculations.
