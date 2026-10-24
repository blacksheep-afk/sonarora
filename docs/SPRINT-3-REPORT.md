# Operation 009 — Sonaroraaah Sprint 3 report

Date: 2026-10-24 (Africa/Johannesburg).

## Outcome and local commit evidence

A functional React decision-support application now consumes the approved Sprint 2 engine through a dedicated adapter. Financial forms, three-strategy comparisons, a hypothetical Money Map and staged-purchase reporting are implemented. Input edits immediately invalidate comparisons, staged results and confirmations. Session/revision/request checks reject delayed work. This is ready for Chief's Sprint 3 acceptance review; Sprint 4 has not begun.

- Repository: C:\Users\Sibusiso Nkosi\OneDrive\Desktop\sonaroraaah.
- Branch: develop throughout; verified clean starting HEAD **9ebeebb3a0458173cf42428da6040d6b9e40f967**.
- Origin fetch/push configuration: https://github.com/blacksheep-afk/sonaroraaah.git.
- Implementation commit: **663530c635e298ee78dc25890d2fbd1eba1e1ef1** — feat: integrate Sonaroraaah financial decision application.
- The implementation commit left a clean working tree. This report is a separate documentation-only commit so it can record the exact implementation hash. Its own hash is resolved by `git log -1 --format=%H -- docs/SPRINT-3-REPORT.md` and supplied in the completion response; a Git commit cannot contain its own final hash.
- No pull, merge, reset, push, remote branch/settings change or deployment was performed. No other checkout was used for repository work.

No AGENTS.md was found in the repository or inspected ancestors. Reviewed the Sprint 2 report, architecture/financial/state/behavior/reference contracts, shell, tests, package configuration and quality scripts. No separate brand specification was found. The existing system-ui typeface and three colors (#10251f, #eaf5ef, #b8dfcb) are retained. Responsive grids, fieldsets, native disclosure, labels, focus treatment and structured timeline are documented Sprint 3 integration choices.

## Implemented workflows

1. **Financial inputs:** cleared cash/bank, expected receipt amount/probability/known or unknown day, two essential bills with shared due day and priority, full stock cost/gross sales/sales lag, emergency and independent/linked assumptions. Advanced assumptions use native disclosure. Blank money fails; absent amounts require explicit zero. All inputs start empty. The user can explicitly load invented illustrative data, never represented as live data.
2. **Comparison:** all three approved strategies appear together. Cards show essential-payment shortfall risk, expected essential shortfall, combined unpaid exposure, per-bill unpaid amounts, ending cash, net after unpaid and purchasing likelihood. Assumptions and limitations accompany the immutable snapshot. No winner, automatic safe label or transaction recommendation is selected.
3. **Money Map:** choose strategy and one actual engine outcome branch. Show the branch's modelled weight, starting reported cleared funds, uncertain receipt assumption, deadlines, chronological purchase/receipt/sales/payment events, Day 30 closure, essential/emergency unpaid and net. A branch is hypothetical, not guaranteed cash or a prediction.
4. **Safe-to-Buy:** supplier acceptance/minimum/increment/fees; starter/later sales estimates; buffer; unresolved/unpaid/partial/paid bill reconciliation; optional reported receipt/date and refreshed funds/remaining expenses; three current user confirmations. Display incomplete, blocked, starter modelled-feasible and later locked/modelled-feasible states, with engine diagnostics and reasons. There is no purchase execution control. Refreshed funds already include receipt; the adapter never adds it again.
5. **Revision/session handling:** every relevant financial edit immediately clears both result types, pending requests and all confirmations. Confirmation toggles clear the staged result. Comparison is explicit, not automatic recalculation. New session clears all data and changes session identity. Loading, empty, validation and unexpected-failure states are visible; ordinary input errors receive field descriptions and an announced summary.

## Adapter and application architecture

`src/application/adapter.ts` implements compareDraft, safeDraft, errorsFor, describeReason, moneyText, eventText and pathLabel, plus immutable draft/example contracts. compareDraft builds ScenarioDraft, calls validateScenario and only then compareValidatedScenario; output is a deeply frozen scenario/comparison/raw-draft snapshot. safeDraft parses supplier/report money with engine parseMoney, validates the scenario, constructs typed provenance and liability records, then calls planSafeToBuy. The adapter rejects a nonzero payment against a zero original bill rather than silently ignoring it. It does not introduce financial calculation policy.

`src/application/session.ts` implements newSession, ticketFor, sessionReducer and visibleSnapshot. It uses Sprint 1 createDecisionState, financialInputChanged, acceptResult, confirmUserReport and currentResult. Symbols are ephemeral session/request identities; revisions are the approved branded revisions. Publication must match session, revision and the currently pending ticket. Stale/superseded completion or failure is ignored. Confirmation events carry captured session/revision; discarded-session edit events are ignored. A new revision zero cannot receive an old session's result. Returned financial payloads are deeply immutable.

App/Field render data and dispatch edits; they contain no financial arithmetic. Display conversion and branch percentage formatting live in the adapter. Core monetary/probability/simulation/comparison/Safe-to-Buy code is unchanged. The application AST policy covers imports, type imports, re-exports and dynamic import escapes; React cannot import the engine directly, and application modules cannot use React/DOM/storage/network capabilities. Existing engine dependency restrictions and engine-only ES2023 compilation remain enforced. Static guards are not a complete security sandbox.

## Actual verification results

Baseline `npm run check` passed before implementation. Final checks ran on Node v24.16.0/npm 11.13.0 with the approved local Python Playwright **1.64.1** setup. No Node dependencies or package-lock.json were changed. requirements-browser.txt pins the existing Playwright version; the local workflow configuration installs it and Chromium for future CI. No GitHub workflow execution is claimed.

| Check | Actual result |
| --- | --- |
| ESLint, zero warnings | pass |
| Strict application TypeScript | pass |
| Engine-only TypeScript without DOM/Node/React ambient types | pass |
| Vitest | **13 files, 288 tests passed** |
| New adapter/session tests | 24 passed |
| New rendered React integration tests | 5 passed |
| New application architecture tests | 13 passed |
| Existing tests | retained; 2 obsolete Sprint 0 placeholder assertions evolved to truthful Sprint 3 scope while retaining disabled banking/storage/payment assertions |
| Original R51 adversarial harness | 2,541 passed; zero failed |
| Original DOM adapter/Safe-to-Buy harnesses | 82 core/UI + 51 Safe-to-Buy checks passed |
| Original R41/R46 comparisons | 21 strategy outputs matched |
| Original precision/bounds assertions | 5 passed |
| Expanded reference runner | 16/16 passed against original R51 |
| Existing financial parity suite | retained: 96 distinct scenarios x 3 strategies, 40 Safe-to-Buy snapshots and independent posting identities |
| Architecture guard | pass; engine DAG retained, application dependency boundary added |
| Production build | pass; 26 modules transformed |
| New built-application Playwright suite | **40/40 assertions passed**, exit 0; desktop 1280px, mobile 390px/320px |
| Separate unchanged original R51 browser suite | **18/18 passed**, exit 0; 1280px/390px |
| Complete final quality gate | exit 0, including mandatory application-browser stage after build |
| Intentional-failure control | child gate exit **1** at test stage; **288 real tests passed plus 1 deliberate failure**; no reference/build/browser stage reached |
| Negative-control wrapper | exit 0 means expected rejection confirmed; temporary sentinel removed |
| Protected reference hashes and engine/reference Git diff | hashes match; zero engine/reference changes |
| Staged whitespace/secret/artifact review | pass; 21 intended implementation files, no credential signatures, frozen references, dependencies, logs or generated builds staged |

The 42 new tests are adapter/state, rendered UI and architecture tests, not 42 independent financial algorithms. The 40 browser assertions cover named UI conditions within a test workflow, not 40 independent customer scenarios. Existing engine math/parity tests remain the financial evidence; contract shapes alone do not prove calculations.

## Independent expectations and real application cases

Adapter equality is checked against the actual compareScenario API, with no copied financial implementation in React. Independent expectations include one cent unpaid; R500 original minus R300 paid = R200 outstanding; refreshed R350 minus R200 reserve = R150 available; R349.99 failing by one cent; and zero original liability contradicting a nonzero reported payment.

Browser checks exercise valid submission/all cards, one-cent unpaid amounts, fractional-cent rejection, field error association/focus, unknown receipt dates with linked assumptions, same-day bill priority, Day 15 wait purchase/Day 29 sale/Day 30 closing, a wait strategy that buys while R500 essential debt persists, partial-payment reserve, no receipt double count, missing/fresh confirmations, one-cent shortage with fresh reports, contradictory payment rejection, supplier refusal, synchronous stale-output disappearance, confirmation clearing and delayed completion after session reset.

Rendered React tests additionally exercise loading/disabled submissions and an injected unexpected adapter failure. Pure session tests cover every scenario and Safe-to-Buy field's invalidation, late result/failure routing, same-revision supersession, cross-session revision-zero collisions, stale confirmation events and discarded-session input events.

The first browser run failed on the Money Map select's label lookup after 20 assertions. Explicit control labels and failure cleanup were corrected. Final reruns pass; this initial failure is not counted as a pass and no financial/reference assertion was removed.

## Accessibility, responsiveness and browser artifacts

Native labels/fieldsets/legends/details, semantic headings/list timeline, visible keyboard focus, workflow anchors, polite status messages and alert validation summary are implemented. Invalid fields reference their error and first invalid focus follows submission; hidden disclosure opens for errors. Keyboard link order and Enter disclosure operation are checked. All inputs/selects have native labels. No horizontal overflow occurs at 1280, 390 or 320 pixels. No unnecessary animation is introduced. Browser checks report no application exceptions or external network requests.

Local ignored evidence (not source or deploy artifacts):

- `test-results/application/results.json`: exact 40 passing assertion names and viewport evidence.
- `test-results/application/desktop.png`: 1280px full-page illustrative workflow screenshot.
- `test-results/application/mobile.png`: 320px full-page illustrative workflow screenshot.
- `docs/sprint-3-baseline.log`, `docs/sprint-3-quality.log`, `docs/sprint-3-negative.log`, `docs/sprint-3-r51-browser.log`: actual command output, intentionally ignored.

Screenshots were visually inspected; the mobile full-page image is long because test disclosures are open. This is not a comprehensive WCAG audit, assistive-technology user test, browser matrix or zoom/text-resize certification. Safari/Firefox and physical mobile devices were not tested. The browser launcher prefers installed Edge and falls back to Playwright Chromium; only local Windows Chromium-family behavior is evidenced here. No real financial/customer data is in these artifacts.

## Frozen reference integrity

| Artifact | Verified full SHA-256 |
| --- | --- |
| reference/R51/index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| reference/R51/evidence/index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| reference/R51/MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip | 79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe |

Protected reference verification includes the preserved standalone/evidence copy and ZIP. The reference checker and original regressions pass. No frozen R51/R37/R19 artifact was edited; historical MOYA filenames remain unchanged for provenance. `git diff 9ebeebb3a0458173cf42428da6040d6b9e40f967 -- src/engine reference` is empty.

## Commands and reproducibility

```powershell
git branch --show-current
git rev-parse HEAD
git status --porcelain=v1 -uall
git remote -v
node scripts/check-reference.mjs
npm run check
npm run gate:self-test
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
$env:PYTHONPATH = Join-Path (Get-Location) '.python-deps'
& 'C:\Users\Sibusiso Nkosi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -u reference/R51/evidence/r51_release_gate_check.py
git diff --check
git diff --cached --check
node tmp/review-sprint-1.mjs
git diff --cached --stat
git diff --cached -- src/application/session.ts .github/workflows/quality.yml scripts/quality-gate.mjs
```

`npm run check` executes lint, application types, engine-only types, all Vitest tests, original/expanded reference regressions with protected hashes, architecture, production build and the new application browser suite. The separate original R51 browser command above remains historical evidence. The new browser wrapper requires Python plus pinned Playwright and installed Edge or Playwright Chromium; missing dependencies/browser launch or assertion failure returns nonzero. SONARORAAAH_PYTHON can select a Python executable; otherwise the bundled Windows runtime or python is used. No dependency download was required for local verification. Test preview processes are terminated; generated outputs/logs, dependencies, .python-deps, browser caches and secrets are ignored.

## Changed files

The implementation commit contains exactly these 21 reviewed files; this report is the 22nd changed path across Sprint 3:

- .github/workflows/quality.yml
- docs/ARCHITECTURE.md
- docs/FINANCIAL-CONTRACTS.md
- docs/REFERENCE-CASES.md
- docs/STATE-CONTRACTS.md
- package.json
- requirements-browser.txt
- scripts/application-browser.mjs
- scripts/application-browser.py
- scripts/application-policy.ts
- scripts/check-architecture.mjs
- scripts/quality-gate.mjs
- src/App.tsx
- src/application/adapter.ts
- src/application/session.ts
- src/foundation.ts
- src/style.css
- tests/application-architecture.test.ts
- tests/application-ui.test.tsx
- tests/application.test.ts
- tests/foundation.test.tsx

## Limitations and outstanding decisions before Sprint 4

All funds, receipts, supplier terms and payments are user-reported, never independently verified. No account connection, payment, backend, database, persistence, deployment, trained ML or automatic purchasing was added. Reset/reload loses the local session. Dates are supported R51 day offsets, not calendar scheduling; there are at most two essential bills with a shared due day. No unentered costs/taxes/interest are invented.

Retained R51 financial limitations remain explicit: binary Number weighted half-cent rounding can differ from decimal rational rounding; separately rounded expected metrics may not visually subtract exactly; essential risk excludes emergency-only debt; wait can purchase despite earlier unpaid obligations; tiny paths are omitted without renormalization; unknown receipt dates exclude receipts. These are not silently corrected in the UI. No calculation policy change or new parity discrepancy was introduced.

Chief's acceptance is still required before Sprint 4. Outstanding product decisions include usability review with intended users, broader accessibility/browser testing, and separately approved handling of any future rounding/business-policy changes. Remote CI execution is unverified because nothing was pushed. The implementation provides tested local decision support, not production assurance or predictive accuracy.
