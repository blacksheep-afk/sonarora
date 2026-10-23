# Operation 009 — Sonaroraaah Sprint 2 financial engine report

Date: 2026-10-24 (Africa/Johannesburg).

## Outcome and local commits

The isolated financial engine is functional and verified against independent expectations and the unchanged R51 reference. The application UI remains unchanged and does not import the engine. This is local implementation evidence, not production approval or a proof of all financial correctness.

- Repository: C:\Users\Sibusiso Nkosi\OneDrive\Desktop\sonaroraaah.
- Branch: develop.
- Origin: https://github.com/blacksheep-afk/sonaroraaah.git (fetch and push configuration).
- Verified clean starting HEAD: **9398777b76bd4c92fdb32b7a9357527db7573dfd**.
- Implementation commit: **5cb9bb173ba5502f5b470a7ea78acdf4cd2fefba** — feat: implement R51-compatible Sonaroraaah financial engine.
- This report is a separate documentation-only commit so it can contain the exact implementation ID. Its ID is available via git log -1 --format=%H -- docs/SPRINT-2-REPORT.md and is returned in the final recovery/verification response.
- The implementation commit left a clean working tree; final working-tree status is checked after committing this report.

All repository work used the Desktop checkout. No branch reset, pull, merge, push, remote branch/settings change, deployment, bank connection, payment, backend, database or trained ML was introduced. Sprint 3 remains unapproved. No AGENTS.md was found in the checkout or inspected ancestors.

## Implemented functions and architecture

| Module | Implemented functions / behavior |
| --- | --- |
| money | parseMoney; checkedCents; nonNegativeCents; inputCents; addCents; subtractCents; sumCents; checkedExpected; weightedCents; roundExpectedCents; toRand; toMoneyText; typed MoneyError |
| validation | validateScenario; parseDay; isValidatedScenario; deepFreeze; structured failure construction |
| probability | parseProbability; isProbability; buildDistribution; displayPercent |
| simulation | simulatePath; simulationDay; three strategies, ordered cent events, persistent liabilities and Day 30 closing metadata |
| comparison | compareScenario; compareValidatedScenario; internal aggregation of all three strategies and weighted exposures |
| safe-to-buy | planSafeToBuy; reportedReceiptDay; runtime input/reconciliation validation; starter/later purchasing constraints and diagnostics |
| state / scenario / explanations | Existing revision transitions retained; scenario contracts retained; explanation code set extended with INVALID_ORDER and actual financial outputs carry reason codes |

Runtime imports now have an explicit, acyclic allowlist, narrower than type dependencies. Money/probability/state remain dependency roots. Validation depends on money/probability; simulation and comparison consume the validated boundary; Safe-to-Buy consumes money and validation. Declarative scenario/explanations modules still prohibit runtime implementation. Forbidden React/DOM/Node/network/storage/import-escape cases remain tested. ES2023-only engine compilation still has no browser, React or Node ambient types.

Sprint 1's blanket prohibition on runtime financial functions was a sprint-specific restriction and was replaced with this authorised Sprint 2 policy; it was not bypassed to hide failed financial tests. No tests were removed. The obsolete money-runtime rejection assertion was evolved into positive authorised-module coverage plus continued rejection in declarative/unapproved modules; an additional runtime-edge test was added.

## Independent mathematical expectations

These expectations are not just copied R51 result values:

| Case | Independent answer / invariant |
| --- | --- |
| Exact cent arithmetic | 30 cents - 10 cents = 20 cents; 19 cents against 20 due leaves 1 cent unpaid |
| Monetary bounds | 1,000,000,000 input cents accepted; one cent more rejected; +/-100,000,000,000 aggregate cents checked before accepting operations |
| Independent events | Receipt .6 and sales .75 imply .45 both, .15 receipt-only, .30 sales-only, .10 neither |
| Linked events | min(.6,.75)=.6 both; .25 neither; zero receipt-only branch omitted |
| Day 0 spending | 30 cents cash - 10 cents stock - 20 cents bill = zero, no phantom shortfall |
| Same-day ordering | A 30-cent receipt funds a 20-cent bill and 10-cent emergency; sales later that day do not retroactively pay an earlier bill |
| Bill priority | R100 funds against two R100 bills pays the selected priority bill; the other R100 remains unpaid |
| Emergency-only debt | No essential bill: essential risk 0, R100 unpaid emergency, net -R100 |
| Closed-form expectation | R10 opening, a 50% R20 receipt and R20 bill: expected cash R5, expected unpaid R5, expected net R0, essential risk 50% |
| Timing horizon | Due Day 14 -> wait purchase Day 15 -> lag 14 -> sale Day 29; cash remains through Day 30 |
| Safe-to-Buy starter | R600 opening - R500 original reserve = R100 available; R100 starter leaves R500 protected; remainder R150 |
| Sales surplus | R160*.75-R100 = R20; R240*.75-R150 = R30; neither figure is profit |
| Partial reconciliation | R500 original - R300 paid = R200 reserve; refreshed R350 fits a R150 later order; R349.99 fails by one cent |
| No double counting | A refreshed R350 balance remains R350 even when the reported receipt is R300; receipt is never added again |

Independent BigInt addition/subtraction expectations cover cent boundaries and high values. For every generated parity outcome, a separate BigInt posting identity verifies closing cash from opening cash plus receipts/sales less purchases/paid bills/emergencies; net must equal closing cash less essential and emergency liabilities. This is an accounting invariant, not a second complete simulation oracle.

## Actual verification results

Runtime: Node v24.16.0; npm 11.13.0. No dependencies or lockfile changed.

| Check | Actual result |
| --- | --- |
| Baseline protected hashes and original suite | passed before modification |
| ESLint | passed; warnings disallowed |
| Main strict TypeScript | passed |
| Engine-only strict TypeScript | passed; no Node/DOM/React ambient types |
| Vitest | **10 files, 246 tests passed** |
| Original R51 adversarial harness | 2,541 passed; zero failed |
| Original R51 DOM adapter | 82 core/UI and 51 Safe-to-Buy checks passed |
| Original R41 comparisons in R51 suite | 21 matched |
| Original precision/bounds assertions | 5 passed |
| Expanded R51 reference runner | 16/16 passed; financial rejection assertions repaired and strengthened |
| Architecture guard | passed for all nine modules |
| Production build | passed; 17 modules transformed; existing UI bundle remains isolated from engine |
| Complete quality gate | exit 0 |
| Deliberate failure | child gate exit 1 at test stage; 246 real tests passed alongside 1 intentional failure; reference/build stages not reached |
| Failure-control wrapper | exit 0 means expected rejection confirmed; temporary test removed |
| Original R51 browser suite | **18/18 passed**, exit 0, Edge at 1280px and 390px |

Vitest breakdown: 2 foundation, 6 existing contract-shape/type, 8 state, 15 architecture, 26 money, 15 validation/probability, 15 simulation/comparison, 21 Safe-to-Buy, 2 runtime-contract/state-integration, and 136 parity tests. The 136 parity tests are 96 distinct financial-scenario fixtures plus 40 distinct Safe-to-Buy snapshots. Each scenario compares three strategies, giving **288 aggregate strategy comparisons** plus path fields, probability weights, purchase timing and accounting identities. Fixture uniqueness is explicitly checked; loops/assertions are not counted as additional Vitest tests.

No unexplained monetary/path/decision mismatch remained for the tested matching valid inputs. This does not establish parity for every possible scenario or independently validate every R51 business rule.

## Precision, boundaries and known retained behavior

Canonical paths use only integer-cent numbers. BigInt is used to parse decimal digits exactly and in independent test oracles. Conversion to number occurs only after the R10 million input bound passes. The R1 billion aggregate bound is far below Number.MAX_SAFE_INTEGER. Every path addition/subtraction and expected-value intermediate is bounded; malformed values never enter a registered scenario.

Probability weighting intentionally remains R51-compatible Number arithmetic; it is not exact decimal-rational arithmetic. Math.round is applied only at expected-money output boundaries, retaining JavaScript's negative-half behavior and signed zero. Output percentages retain R51's two-decimal display rounding.

**Known unresolved precision limitation:** exact decimal-rational 50 cents * 29/100 = 14.5 cents would round to 15 under positive half-up rounding. R51 evaluates the binary product slightly below 14.5 and returns 14. The new engine deliberately also returns 14. A test proves and documents this difference; it is not represented as mathematically exact expected-value arithmetic. Fixing it would change observable R51 results and needs explicit policy/correction approval.

R51 also omits path weights <=1e-10 without renormalization; total-weight validation allows that bounded omission. Expected metrics are rounded independently from unrounded path-weighted values; consumers must use expectedNetAfterUnpaid rather than reconstruct it from separately rounded display metrics.

The wait strategy is historical timing behavior, not guaranteed bill protection: with R300 arriving Day 3 after a missed R500 Day 2 bill, wait can buy R100 stock and leave R200 cash plus R500 unpaid (net -R300). Trigger remains blocked after prior unpaid obligations. These results stay visible and labelled modelled, not advice.

## Discrepancy classification and failed runs

| ID | Classification | Resolution / status |
| --- | --- | --- |
| REF-LEXICAL-01 | Existing expanded-test implementation bug | VM object did not expose lexical const centsOf/addC; generic assert.throws could pass on TypeError. Explicit lexical exports plus function/error-message checks now prove the intended financial rejection. Historical scripts unchanged. |
| TEST-URL-01 | New parity-harness implementation bug | jsdom transformed import.meta.url into an HTTP URL. Local file reads now use explicit Node paths. First run had one failed test, a parity suite that could not load, and 102 passing tests; preserved log records it. No parity pass was claimed for that run. |
| CONTRACT-RESULT-01 | Sprint 1 proposed-contract mismatch | Function aliases now return error-aware results; simulation accepts a registered ValidatedScenario; comparison starts from a raw draft, not arbitrary outcomes. Financial valid-input behavior unchanged. |
| CONTRACT-DAY-01 | Sprint 1 contract too narrow | ReportedReceiptDay admits Day 0 and late nonnegative integer offsets, matching R51 Safe-to-Buy's reported-receipt logic. Unlocking still requires day <= due day. Scenario input days stay 1..14. |
| CONTRACT-META-01 | Proposed output representation completed | Provenance, structured events/closure and Safe-to-Buy diagnostics added; no historical monetary decision altered. |
| INPUT-STRICT-01 | Required input hardening | Negative syntax including -0, missing/contradictory fields, duplicate bills, unsupported dates/models and inconsistent outstanding amounts are explicit structured rejections. Private R51 helpers may throw or be looser on malformed objects; these are not claimed as matching valid-scenario decisions. |
| ROUND-LEGACY-01 | Retained R51 numerical limitation; proposed correction not implemented | Binary half-cent example above remains R51-compatible rather than silently altered. |
| WAIT-LEGACY-01 | Retained R51 business behavior | Wait may buy with earlier unpaid bills; liabilities/risk/net remain explicit. Changing the rule requires approval. |

Authoring also encountered a contract replacement-marker mismatch; it was corrected without resetting or discarding work. Final strict compilation and all tests ran after the completed edits. No historical artifact or test expectation was changed to force a financial parity pass.

## Protected reference evidence

| Artifact | Verified SHA-256 |
| --- | --- |
| R51 standalone index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| ZIP embedded/extracted index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip | 79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe |

The entire reference directory, UI files and package-lock.json have no diff from the verified Sprint 1 baseline. No R19/R37 artifact was accessed or modified. The preserved Node/browser scripts were invoked as-is. Only the separate expanded runner in scripts/ was repaired.

## Commands and retained logs

- git branch --show-current; git rev-parse HEAD; git status --porcelain=v1 -uall; git remote -v.
- node scripts/reference-regressions.mjs (baseline and complete gates).
- npm run typecheck (intermediate strict verification).
- node scripts/check-reference-cases.mjs (repaired harness verification).
- npm run check (lint -> main types -> engine types -> Vitest -> preserved/expanded reference checks -> architecture -> Vite build).
- npm run gate:self-test.
- node scripts/check-reference.mjs.
- Original reference/R51/evidence/r51_release_gate_check.py with PYTHONPATH set to this checkout's .python-deps, using bundled Python at C:\Users\Sibusiso Nkosi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe. Playwright 1.64.1 selected installed Edge.
- git diff --exit-code 9398777 -- reference src/App.tsx src/foundation.ts src/main.tsx src/style.css index.html package-lock.json.
- Explicit-path staging; git diff --cached --check; staged credential/artifact review; local commits.

Ignored local logs: docs/sprint-2-first-run.log, docs/sprint-2-quality.log, docs/sprint-2-negative-control.log and docs/sprint-2-r51-browser.log. Logs, dependencies, .python-deps, temporary transfer/review files, build outputs, environment files and browser caches were excluded from commits. Pattern review found no credential signatures; it is not an exhaustive security audit.

## Changed files

Implementation commit changed 24 paths; this report adds a 25th path.

| Group | Paths |
| --- | --- |
| Engine (7) | src/engine/money/index.ts; probability/index.ts; validation/index.ts; simulation/index.ts; comparison/index.ts; safe-to-buy/index.ts; explanations/index.ts (all under src/engine) |
| Architecture/reference tooling (3) | scripts/architecture-policy.ts; scripts/check-architecture.mjs; scripts/check-reference-cases.mjs |
| Existing test policy (1) | tests/engine/architecture.test.ts |
| New financial tests/helpers (8) | tests/engine/financial-fixtures.ts; money-runtime.test.ts; r51-parity.test.ts; r51-reference.ts; runtime-contracts.test.ts; safe-to-buy-runtime.test.ts; simulation-comparison.test.ts; validation-probability.test.ts |
| Documentation (6) | README.md; docs/ARCHITECTURE.md; docs/FINANCIAL-CONTRACTS.md; docs/REFERENCE-CASES.md; docs/STATE-CONTRACTS.md; docs/SPRINT-2-REPORT.md |

## Security/correctness limitations and issues before Sprint 3

1. Resolve whether to preserve or explicitly correct the binary weighted-rounding/tiny-path policies. Exact rational expected-money accuracy is not established by this compatible implementation.
2. Review the wait-with-unpaid-bills rule and all user-facing risk/feasibility wording before UI integration; no automatic strategy recommendation is implemented.
3. Future UI/worker integration must advance revisions on every relevant edit and isolate decision sessions. Revision consistency cannot detect edits made outside that protocol or verify real-world receipt/bill truth.
4. Frontend raw supplier-draft adapters and full new-engine browser/UI integration remain unimplemented. The 18 browser checks exercise historical R51, not an integrated new UI.
5. Runtime snapshots/results are owned and deeply frozen, but hostile getters/proxies and all possible JavaScript type escapes are outside a comprehensive security guarantee. Serialized scenarios require revalidation. The architecture guard is conservative static enforcement, not a sandbox.
6. Tests cover stated examples and finite adversarial/parity matrices, not every possible input. Customer outcomes, supplier terms, forecasts, real bank balances, operational readiness and regulatory/security approval remain unverified.
7. Remote CI and deployment were not run. Only Chief may push. Local functional/verification exit checks passed with the documented retained limitations; Sprint 3 requires Operation 009 approval.
