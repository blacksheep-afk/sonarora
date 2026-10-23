# Historical behavior and planned contracts

Source: user-provided historical transcript. Requires verification against original R51 before engine migration.

- Money uses integer cents, rejects fractional cents, negatives, malformed decimal strings and amounts over R10,000,000. Guard aggregate arithmetic at R1,000,000,000.
- Model up to 14 days, cleared cash/bank funds, expected receipts, essential obligations, stock, sales and emergencies. Expected money never increases opening cleared funds.
- Compare buy now, wait until after the essential due date, and buy after the expected receipt clears. Receipt events precede same-day obligations; no silent purchase retries.
- Preserve explicit unpaid liabilities, conditional sales receipts, separate probability weights and output-boundary rounding.
- Safe-to-Buy uses manual supplier terms, reserves, full/partial/paid bill status and fresh confirmations. A refreshed balance already includes cleared receipts; do not add them twice.
- Input edits immediately invalidate old results and dependent confirmations. Invalid input must not expose previous results.
- Sample vendor history is synthetic. User entries are unverified. Sales surplus is not profit.

Proposed modules: Money, ScenarioInput, ScenarioValidation, ScenarioOutcome, DecisionComparison, SafeToBuyInput, SafeToBuyPlan, DecisionState and Explanation. These are documentation only; implementation belongs to later approved work.

Migration acceptance must include exact-cent arithmetic and one-cent boundaries; monetary limits; expected-versus-cleared receipts; full/partial/paid liabilities; supplier constraints; stale results and confirmation invalidation. Expected outputs derived from historical claims must be re-run against immutable R51, alongside independent cases. Inherited harnesses are not an independent financial oracle.
