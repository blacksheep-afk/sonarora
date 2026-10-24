# Operation 009 — Sprint 4 hardening report

Date: 2026-10-24, Africa/Johannesburg.

## Outcome: incomplete, release gate blocked

Hardening and documentation are implemented and preserved for review. **Sprint 4 has not met its exit gate.** Local WebKit 27.2 fails the unchanged first workflow-link Tab assertion. Chief explicitly instructed that the proposed tabindex zero fix remain unapplied and the blocker be reported. No test was skipped, weakened or marked expected-failure to conceal it.

No Sprint 4 commit was created: local commit permission was conditional on successful checks, and the mandatory complete gate returns 1. All intended changes are staged and uncommitted. The working tree is therefore intentionally not clean.

- Official repository: C:\Users\Sibusiso Nkosi\OneDrive\Desktop\sonaroraaah.
- Branch: develop; no branch change.
- Verified clean starting commit and unchanged current HEAD: **88714e1cfd8acd797a4f5e577f2345f1afbeaf73**.
- Accepted Sprint 3 implementation ancestor: **663530c635e298ee78dc25890d2fbd1eba1e1ef1**.
- Origin: https://github.com/blacksheep-afk/sonaroraaah.git.
- New Sprint 4 commit IDs: **none**.
- No pull, merge, reset, push, deployment, remote branch/settings change or Sprint 5 work occurred.

No AGENTS.md was found in the checkout or inspected ancestors. Sprint 3 reports/contracts, application source, architecture policies, quality/CI/browser scripts and existing tests were reviewed before editing. Baseline verification reproduced all 288 Vitest tests, 40 application browser assertions and 18 historical browser assertions before changes.

## Implemented hardening

- App/focusInput: error links open the relevant disclosure and focus its control; unmatched/global errors and unexpected failures focus a summary; failure recovery returns to financial inputs. Pending comparison/staged regions expose aria-busy.
- App/Money Map: displayed selection remains valid when outcome count shrinks; reset/example loading resets the visual strategy selector. This is view state, not a changed financial decision rule.
- Financial copy: visible wait-with-unpaid-bills and R51 half-cent limitations; explicit assumed probabilities and gross-sales-not-profit labels/events; essential risk versus combined unpaid/emergency debt; cash versus net after liabilities; user reports versus independent verification. No financial engine, scenario rule or financial arithmetic changed.
- style.css: native target heights, checkbox label target area, long-description wrapping and enlarged-text reflow; reduced-motion override. Existing system-ui and three brand colors remain.
- index.html: obsolete Sprint 0 description replaced with accurate decision-support/privacy copy.
- application-policy: reject known unsafe HTML sinks, cookie/global capability access, string-code timers and known computed sink access; preserve existing imports/DAG and engine-only ambient restrictions.
- Browser tooling: preserve all 40 original assertions, add 32 hardening assertions and six axe states, record actual browser versions/failed diagnostics, reset evidence to running before each attempt, execute Firefox/WebKit with genuine exit codes.
- quality gate: add mandatory unchanged historical browser suite and cross-browser stage. Missing tooling or a failed assertion remains nonzero.
- CI configuration: reviewed read-only permissions; declare pinned tooling, three browser installations and both negative controls. No remote CI execution is claimed.

## Actual final verification

| Check | Result |
| --- | --- |
| npm ci --ignore-scripts | passed; lockfile reproduced |
| npm installation audit / npm audit --omit=dev | both reported zero known vulnerabilities in their 2026-10-24 responses |
| ESLint / strict application TypeScript / engine-only TypeScript | passed |
| Vitest | **15 files, 306 tests passed**; original 288 retained plus 7 UI and 11 security tests |
| Original adversarial reference suite | 2,541 passed |
| Original DOM/Safe-to-Buy suites | 82 core/UI + 51 staged-purchase checks passed |
| Original R41/R46 comparison / precision checks | 21 strategy outputs / 5 assertions passed |
| Expanded R51 cases | 16/16 passed |
| Existing financial engine parity | preserved 96 distinct scenarios x 3 strategies and 40 Safe-to-Buy snapshots |
| Architecture policies | passed |
| Production build | passed; 26 modules |
| Chromium-family 155.0.4283.62 | **72/72** assertions passed |
| Firefox 157.0 | **72/72** assertions passed |
| WebKit 27.2 | executed; **failed** after 1 passing blank-session assertion |
| Axe-core 4.14.0 | 6 scans per passing browser: **12 scans, 0 violations, 0 incomplete**; WebKit scans not reached |
| Original R51 browser suite | **18/18 passed**, separate immutable historical target |
| Complete npm run check | **exit 1 at cross-browser**, not a pass |
| Vitest negative control | child gate exit 1 at test stage, 306 real tests plus 1 deliberate failure; wrapper exit 0 confirms rejection |
| Accessibility negative control | child gate exit 1 at application-browser for label violation targeting #axe-negative-control; wrapper exit 0 confirms rejection |
| Final staged whitespace/credential/artifact review | passed for the intended source/documents; report receives the same final audit |
| Protected reference hashes | match; no engine/reference Git changes |
| Production dependency/bundle review | axe exact integrity/dev classification match; no axe-core/axe.run/axe.version identifier in built JavaScript |

Passing browser counts are repeated named assertions, not 144 independent financial scenarios. Automated axe output is scoped to configured tags/states, not complete WCAG certification. The financial tests remain calculation evidence; new UI contract/shape assertions are not a replacement mathematical oracle.

## Open WebKit blocker and user direction

Default local WebKit first plain Tab focuses **Load illustrative example**, skipping the expected **1. Your inputs** workflow link. The exact failing assertion is Keyboard reaches first workflow link. Installation and browser launch succeeded; it is not reported as an unsupported/unexecuted browser.

An execution request to apply native tabindex zero and rerun was rejected before execution. Chief subsequently explicitly chose: leave it unapplied and report the blocker. The application contains no such tabindex zero addition; no Alt+Tab substitution, browser exclusion or test bypass was introduced. Error/failure regions use tabindex -1 only for programmatic recovery.

The full gate remains failing. WebKit mobile, subsequent financial interactions and axe scans are not marked passing. See CROSS-BROWSER-RESULTS.md and test-results/application-webkit/failure-detail.json / failure.png.

The first hardening trial also exposed a fixture mistake: the first rapid “edit” reused the already displayed R600. It was changed to 20 genuinely different amounts, preserving the stale-result assertion. A trailing blank line caught during staged validation was removed. Neither correction changes financial expectations or suppresses a product failure.

## Resilience and financial communication evidence

Passing browser cases include empty/malformed/fractional-cent inputs, maximum allowed R10 million values and one cent over, unknown receipts/linked probabilities, bill priority, Day 15/29/30 behavior, wait-strategy unpaid debt, emergency-only unpaid with zero essential risk, partial-payment reserves, receipt non-double-counting, twenty rapid edits, repeated Compare/staged requests, stale confirmations and delayed completion after session reset. Back/forward navigation cannot restore an edited result; reload starts blank with no confirmations.

Rendered tests cover unexpected comparison/staged adapter failures, loading/disabled submissions, focus recovery, global error summaries and map selection after shrinking distributions. Existing revision/session tests retain stale/superseded work and cross-session revision-zero coverage. Very long error descriptions reflow in the actual browser.

The demo uses only invented R600/R300/R500/R250 assumptions and a R300 partial bill payment. It shows all three strategies, a hypothetical unpaid branch, staged locking/feasibility, one-cent shortage, invalidation and reset. No recommendation, measured impact, adoption, customer testimonial, supplier approval or FNB endorsement is fabricated.

## Accessibility and security limits

Measured palette contrast is 14.39:1 for foreground/background and 11.06:1 for accent/background and inverse primary buttons. Active targets are at least 44px high in tested states. Heading order, native labels, visible focus, selected keyboard actions, errors, reduced motion and reading-order snapshots are checked.

200% CSS text reflows at 1280/390/320 pixels; 320 CSS pixels is a 400%-reflow proxy from 1280, not a native browser-chrome/OS zoom certification. Physical devices, Safari on macOS/iOS, forced colors, exhaustive keyboard workflows and NVDA/JAWS/VoiceOver user testing remain follow-up. WebKit is an explicit current failure.

No application external requests were observed in complete passing workflows; local/session storage and cookies remain empty. Storage/unsafe rendering/dynamic code/dependencies are also inspected statically. These are scoped checks, not an exhaustive storage audit, penetration test or complete sandbox.

Chief explicitly approved exact-pinned, MPL-2.0 axe-core 4.14.0 after dependency review; it has no package dependencies and is development-only. Installation suppressed lifecycle scripts, and its lockfile integrity matches the reviewed artifact. Production dependencies did not change. Python Playwright stays 1.64.1; Firefox/WebKit matching binaries installed to ignored .browser-cache. Remote CI is unexecuted.

Retained R51 financial limitations remain: binary weighted half-cent rounding, separately rounded metrics, essential-only risk, wait purchases despite earlier unpaid bills, unknown receipt exclusion and shared bill due date. No banking, payments, backend, database, authentication, analytics, persistence, trained ML, automatic purchasing or new financial policy was introduced.

## Protected reference SHA-256

| Artifact | Full SHA-256 |
| --- | --- |
| reference/R51/index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| reference/R51/evidence/index.html | ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d |
| reference/R51/MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip | 79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe |

No frozen R51/R37/R19 artifact was modified. git diff 88714e1cfd8acd797a4f5e577f2345f1afbeaf73 -- src/engine reference is empty.

## Commands and local evidence

Commands executed in the official Desktop checkout:

- git branch --show-current; git rev-parse HEAD; git status --porcelain=v1 -uall; git remote -v (separate read-only baseline checks).
- node scripts/check-reference.mjs.
- npm view axe-core version license dependencies engines repository dist.integrity --json (review before explicit approval).
- npm install --save-dev --save-exact axe-core@4.14.0 --ignore-scripts.
- npm audit --omit=dev --json.
- npm ci --ignore-scripts.
- npm run typecheck; npm run lint; npm test; npm run build (individual implementation verification).
- npm run test:browser; npm run test:cross-browser.
- npm run test:reference-browser (via the final full gate).
- npm run accessibility:self-test.
- npm run gate:self-test.
- npm run check (baseline passed; final fails at the retained WebKit blocker).
- git diff --cached --check; node tmp/review-sprint-1.mjs; git diff --cached --stat; staged lockfile/policy review.
- Exact dependency integrity, dev classification, declined-fix absence and absence of axe identifiers in production JavaScript were separately asserted.

Browser setup used the approved bundled Python executable with PYTHONPATH pointing to .python-deps and PLAYWRIGHT_BROWSERS_PATH pointing to .browser-cache, then python -m playwright install firefox webkit. Full reproduction/CI configuration installs chromium firefox webkit. No remote workflow pass is claimed.

Ignored local logs: docs/sprint-4-baseline.log, sprint-4-baseline-r51-browser.log, sprint-4-quality.log, sprint-4-negative.log, sprint-4-accessibility-negative.log, sprint-4-clean-install.log, sprint-4-dependency-install.log, sprint-4-production-dependency-audit.log and sprint-4-browser-install.log.

Ignored browser evidence: test-results/application, application-firefox, application-webkit and cross-browser.json. Passing families include results.json, six axe JSON files, reading-order.txt and desktop/mobile screenshots. WebKit includes the actual failure JSON/screenshot. The mobile screenshot and WebKit failure screenshot were visually inspected. All data shown is invented.

## Changed files and final work preservation

- .github/workflows/quality.yml
- docs/ACCESSIBILITY-AUDIT.md
- docs/ARCHITECTURE.md
- docs/CROSS-BROWSER-RESULTS.md
- docs/DEMO-SCRIPT.md
- docs/SECURITY-PRIVACY-REVIEW.md
- docs/SPRINT-4-REPORT.md
- index.html
- package-lock.json
- package.json
- scripts/accessibility-self-test.mjs
- scripts/application-browser.mjs
- scripts/application-browser.py
- scripts/application-policy.ts
- scripts/cross-browser.mjs
- scripts/hardening_browser.py
- scripts/historical-browser.mjs
- scripts/quality-gate.mjs
- src/App.tsx
- src/application/adapter.ts
- src/style.css
- tests/hardening-security.test.ts
- tests/hardening-ui.test.tsx

These 23 paths are intentionally staged for review, with no new commit. Dependencies, .python-deps, browser cache, build output, screenshots/results/logs, temporary files and secrets remain excluded. No existing uncommitted work was discarded.

**Remaining exit work:** the known WebKit plain-Tab workflow failure remains unresolved under Chief's direction; mandatory gate success, clean local commit and Sprint 4 acceptance therefore remain outstanding. Sprint 5 has not begun.
