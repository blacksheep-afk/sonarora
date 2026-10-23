# Reference cases and evidence boundaries

Preserved baseline: R51 HTML SHA-256 ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d.
The original Node regression suite remains unchanged and runs first. The expanded cases below run against the original R51, using the original DOM adapter's bootstrap. They are migration acceptance examples, not tests of a new financial implementation. The reused adapter is not an independent oracle.

| Case | Input/condition | Expected historical result | Evidence |
| --- | --- | --- | --- |
| REF-T01 | R0 funds, certain R100 receipt Day 1, R100 bill Day 1, stock R0 | unpaid R0; receipt precedes bill | executable R51 case; direct cash arithmetic |
| REF-T02 | same but receipt Day 2 and bill Day 1 | deadline shortfall R100 persists | executable R51 case |
| REF-T03 | R200 initial funds, stock R250, certain R300 later receipt | buy-now is not retried; buyChance 0 | executable R51 case |
| REF-M01 | R0.30 funds, R0.10 + R0.20 bills, stock R0 | unpaid and closing cash both R0 | executable R51 case; exact-cent oracle |
| REF-L01 | independent receipt .6, sales .75 | both .45, receipt-only .15, sales-only .30, neither .10 | executable R51 case; direct probability arithmetic |
| REF-L02 | linked same marginals | both .6, neither .25; zero receipt-only path omitted | executable R51 case; min-marginal rule |
| REF-L03 | receipt probability 1 but unknown date | no path receives the receipt | executable R51 case |
| REF-P01 | R500 bill, R300 paid, R150 later order, refreshed R350 / R349.99 | exact boundary unlocks / one cent below locks | executable R51 case; independent remainder 500-300=200 |
| REF-P02 | original liability unresolved, ample reported funds | later batch stays locked | executable R51 case |
| REF-F01 | money text 0.001 | throw; do not silently round | executable R51 parser case |
| REF-F02 | money text 10000000.01 | reject one cent over individual maximum | executable R51 parser case |
| REF-F03 | aggregate 100000000000 cents + 1 | throw before unsupported amount | executable R51 arithmetic case |
| REF-S01 | historical form input event after comparison | old result removed immediately; Compare choices warning | executable R51 UI-adapter case |
| REF-T04 | due Day 14, wait buys Day 15, sales lag 14 | sales Day 29 counted within Day 30 horizon | executable R51 timing case |
| REF-M02 | R100 funds and two R100 bills, first/second priority | first bill unpaid R0 / R100 respectively | executable R51 order case |
| REF-E01 | emergency R100 unpaid, no essential bill | essential risk 0, unpaid R100, net -R100 | executable R51 risk-scope case |

The new revision tests separately cover stale inputs, invalid revisions, delayed results, delayed confirmations and failure behavior. They verify the proposed state model, not R51 UI event handling. The inherited Node suite and packaged browser runner provide separate historical UI evidence.

## Cases retained for future financial migration

R0.30 minus R0.10 leaves R0.20; one-cent essential shortfall; Day 30 horizon events and purchases beyond horizon; emergency and essential ordering; shared due date for two bills; unknown receipt timing; conditional purchase after a reported receipt with no prior shortfall; no sales without purchase; paid/unpaid/partial/none liability consistency; supplier nonacceptance/minimum/increment/fees; fresh balance already includes receipt; immediately hidden results on invalid edit.

These are a review checklist, not additional passing tests. Implementing future rules requires named inputs, an independently checked expectation where possible, a preserved-reference comparison and explicit approval of any discrepancy. Contract-shape fixtures and branded casts do not validate values or prove financial calculations.

## Sprint 2 executed parity and independent evidence

The functional engine is tested against 96 distinct raw scenarios x three strategies (288 aggregate comparisons plus their outcome records), and 40 distinct matching Safe-to-Buy snapshots. Fixture uniqueness is checked so duplicate cases are not misrepresented as coverage. An independent BigInt posting identity verifies each new path's closing cash and net after unpaid liabilities. Named independent tests separately cover cent arithmetic, closed-form expected exposure, receipt/bill/emergency/sales ordering, bill priority, purchase rules and stale/contradictory confirmations.

The original R51 suite and all 16 expanded cases still execute. REF-F01/F02/F03 were strengthened: the original expanded bootstrap did not expose lexical const helpers, allowing TypeError to satisfy a generic assert.throws. The bootstrap now explicitly obtains centsOf/addC from the preserved VM lexical scope and requires their actual financial rejection messages. This fixes test code, never the historical reference.

Known classified differences: public APIs return structured errors and immutable validated data; supplier off is normalized into blocked/incomplete; reported receipt day permits zero/late offsets; a Day 30 closure event and result provenance are new metadata. None changes valid-scenario monetary decisions.

Known retained limitations are tested, not hidden: R51 binary-weight half-cent rounding, essential-only risk, wait purchases despite earlier unpaid bills, tiny-path omission without renormalization and independent rounding of expected metrics. Proposed changes to these policies are not implemented.
