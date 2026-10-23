# Operation 009 — Sonaroraaah Sprint 1 report

## Outcome and commit

Sprint 1 architecture and typed-contract work is implemented and locally verified. No financial engine was migrated. Only pure revision-state transitions are new executable engine logic. Sprint 2 remains unapproved.

- Repository: C:\Users\Sibusiso Nkosi\OneDrive\Desktop\sonaroraaah.
- Branch: develop.
- Origin fetch/push URL: https://github.com/blacksheep-afk/sonaroraaah.git.
- Verified Sprint 0 baseline: 14a7cab4799fc99d294e762514ace10ccb511126; initial tree was clean.
- Implementation commit: **f3149906a747291c8bda7b7c9f0bed0d20aafc2d** — feat: define Sonaroraaah Sprint 1 architecture and typed contracts.
- This report is committed separately so it can record the implementation's exact ID. Resolve its metadata-only commit with git log -1 --format=%H -- docs/SPRINT-1-REPORT.md. The implementation tree was clean before adding this report; final status is independently checked after the report commit.
- Work ran across 23–24 October 2026, Africa/Johannesburg.

All work used the Desktop checkout. The old ChatGPT checkout was not reopened. The Desktop path required approved execution outside the chat sandbox. No GitHub push, remote branch/settings change, deployment or Sprint 2 work was performed.

## Architecture decisions

Nine modules live under src/engine: money, scenario, validation, probability, simulation, comparison, safe-to-buy, state and explanations. ARCHITECTURE.md records the dependency graph; engine imports are type-only. The guard rejects unapproved edges, external dependencies, import indirection, DOM/Node/storage/network globals and financial runtime functions/calls/classes outside state. Negative fixtures test these restrictions. A separate ES2023-only engine compilation has no React, Node or DOM ambient types.

Money uses opaque numeric integer-cent brands, matching R51's bounded exact-number representation. Individual input maximum is 1,000,000,000 cents; aggregate/intermediate absolute maximum is 100,000,000,000 cents. Probabilities, display percentages, output-rounded expected cents, input days and simulation days have distinct types. Raw drafts remain strings. Parser, financial validation, distribution, simulation, comparison and staged-purchase functions are signatures only.

Financial scenario, supplier, liability, event, exposure, reason and display records are readonly. Expected receipts never masquerade as opening cleared funds. Reported cleared receipts and refreshed balances are distinct. User attestations always say user-reported and independentlyVerified=false.

The state reducer increments the input revision, immediately removes old results and all dependent confirmations, rejects stale result/confirmation submissions, and hides mismatched result envelopes. It freezes its envelopes and attestations. It performs no financial computation and does not wire UI events.

## Corrections from direct R51 inspection

The earlier handover's 14-day simulation description was inaccurate. R51 accepts input days 1..14 but run() simulates through Day 30. A wait purchase after a Day 14 due date may happen on Day 15 and produce sales on Day 29. Contracts and an executed reference case preserve this.

R51 has a first/second same-day bill-payment priority; this is explicit in the new scenario contract and tested against the reference. R51's displayed risk/shortfall tracks essential bills, while unpaid emergency amounts are tracked separately. An emergency-only unpaid case therefore has essential risk 0, not 100. These are historical rules, not changes to financial behavior.

Linked probability uses min(receipt marginal, sales marginal). No arbitrary correlation/joint-probability input was introduced. Unknown receipt dates exclude receipts from scenario paths.

## Actual results

| Verification | Actual result |
| --- | --- |
| npm ci in Desktop checkout | exit 0; 172 packages installed; lockfile unchanged |
| ESLint | passed with warnings disallowed |
| Main strict TypeScript check | passed, including contract/type-level assertions and expected type errors |
| Engine-only TypeScript check | passed with ES2023 and types=[] |
| Vitest | 4 files, 30 tests passed: 2 inherited foundation, 6 contract-shape/type tests, 8 state tests, 14 architecture cases |
| Original R51 adversarial harness | 2,541 passed, zero failed |
| Original R51 DOM adapter | 82 inherited core/UI and 51 Safe-to-Buy checks passed |
| Preserved R41 comparison within R51 suite | 21 strategy outputs matched |
| Original precision/bounds assertions | 5 passed |
| Expanded R51 reference cases | 16/16 passed against original reference, not a migrated engine |
| Architecture check | all 9 modules passed |
| Vite production build | passed; 17 application modules transformed; engine not connected to UI |
| Complete quality gate | exit 0 |
| Intentional test failure | child gate exit 1 at test stage; 30 real tests still passed; reference/build stages not reached |
| Failure-diagnostic wrapper | exit 0 confirms expected rejection; temporary failing test removed |
| Original packaged R51 browser regression | 18/18 passed, exit 0, installed Edge via Playwright, widths 1280 and 390 |

The 30 Vitest checks do not test unimplemented money parsing or financial calculations. Type brands and shape fixtures do not validate actual values. The 16 expanded cases exercise untouched R51 through its original DOM-adapter bootstrap; they are not a new independent financial oracle. The browser suite tests original R51, not end-to-end integration of the new contracts.

One initial expanded stale-input assertion failed because the expected warning used the word recalculate. The actual preserved warning says Select Compare choices. Corrected the new test expectation to match the reference; no reference edit was made. A PowerShell replacement command and an oversized Windows command also failed during authoring; final files were applied through bounded local transfer files and all final checks were rerun. No failed run is counted as a pass.

## Commands and provenance

Runtime: Node v24.16.0, npm 11.13.0. Locked application dependencies are unchanged.

Commands executed:
- git status --porcelain=v1 -uall; git branch --show-current; git remote -v; git cat-file -t 14a7cab.
- npm ci.
- npm run check: ESLint -> main tsc -> engine tsc -> Vitest -> original/expanded reference checks -> architecture -> Vite build.
- npm run gate:self-test.
- node scripts/check-reference-cases.mjs (targeted reference-case development).
- node scripts/check-reference.mjs.
- git diff --exit-code 14a7cab -- reference src/App.tsx src/foundation.ts src/main.tsx src/style.css index.html package-lock.json.
- git diff --cached --check and staged-content credential/artifact review.
- Local git commit after successful gates.

Browser dependency: Playwright 1.64.1 installed into ignored .python-deps in this checkout; no use of the old checkout's packages. Bundled Python 3.12 at C:\Users\Sibusiso Nkosi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe ran the original reference/R51/evidence/r51_release_gate_check.py with PYTHONPATH set to this checkout's .python-deps. It selected installed Edge, so no Chromium download was needed.

Ignored local outputs: docs/sprint-1-quality.log, docs/sprint-1-negative-control.log, docs/sprint-1-r51-browser.log. Dependency directories, temporary review scripts, build outputs and logs were not staged. Staged review found no credential signatures or unrelated/generated artifacts; this is not an exhaustive security audit.

## Preserved references and UI

R51 standalone and extracted HTML SHA-256:
ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d

Original MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip SHA-256:
79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe

Full hashes were verified during Sprint 1. Git comparison confirms the entire reference directory is unchanged from Sprint 0, including original scripts and ZIP. No R19 or R37 artifacts were accessed or modified. Application UI files and lockfile likewise match Sprint 0. The old shell's Sprint 0 placeholder text remains intentionally unchanged; acceptance is recorded in README and reports, not by a UI redesign.

## Changed files

Implementation: 25 files. This report adds one documentation file; total 26 paths from Sprint 0.

| Group | Paths |
| --- | --- |
| Nine engine modules | src/engine/money/index.ts; probability/index.ts; scenario/index.ts; validation/index.ts; simulation/index.ts; comparison/index.ts; safe-to-buy/index.ts; state/index.ts; explanations/index.ts (all under src/engine) |
| New tests | tests/engine/contracts.test.ts; tests/engine/state.test.ts; tests/engine/architecture.test.ts |
| New tooling | scripts/architecture-policy.ts; scripts/check-reference-cases.mjs; tsconfig.engine.json |
| Updated tooling | scripts/check-architecture.mjs; scripts/quality-gate.mjs; scripts/reference-regressions.mjs; tsconfig.json; package.json |
| Documentation | README.md; docs/ARCHITECTURE.md; docs/FINANCIAL-CONTRACTS.md; docs/STATE-CONTRACTS.md; docs/REFERENCE-CASES.md; docs/SPRINT-1-REPORT.md |

## Limitations and outstanding questions

- No runtime money parser, financial schema/validator, probability calculation, simulation, risk aggregation or purchasing-plan implementation exists in the new engine.
- Brands and readonly types can be bypassed by casts/untyped callers. Runtime boundary validation and immutable payload snapshot enforcement remain future work. State freezes envelopes, not arbitrary payload aliases.
- Revision guards apply within one decision session. Future UI/worker routing must prevent a discarded session's work from reaching a fresh session at the same revision number. No UI recalculation or stale-state integration is claimed here.
- The dependency guard is conservative static enforcement, not a comprehensive security proof. Remote CI was not run because Chief controls pushes.
- Structured reason/error codes and normalized Safe-to-Buy statuses are proposed contracts; they are not exact copies of R51 DOM strings or internal off/feasible statuses.
- Before financial migration, review decimal-text adapters, duplicate bill-ID rejection, paid/outstanding consistency, output rounding/tolerance rules, event mapping and numeric-cent versus BigInt internals. Do not broaden independent bill dates, receipt count, arbitrary linked probabilities or horizon without explicit behavior review.
- Financial correctness, customer benefit, supplier acceptance and bank verification remain unproven by these contract checks. No backend, database, banking connection or payment was added.
- Local Sprint 1 exit checks passed. Sprint 2 requires Operation 009 approval.
