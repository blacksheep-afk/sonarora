# Local redesign verification

## Baseline — 25 October 2026, Node 24.18.0

Clean ui/redesign branch from develop. npm ci succeeded.

Initial npm run check: **exit 1**, at application-browser (`spawnSync python ENOENT`). Lint, application TypeScript, engine TypeScript, all 306 tests in 15 files, reference checks, architecture checks and production build passed. Missing local Python/Playwright configuration is a tooling failure, not a passing browser gate. Complete output retained locally in /tmp/sonarora-baseline.log.

Subsequently located Python 3.13 and installed the pinned requirements-browser.txt dependencies into ignored .python-deps. Browser binaries are installed into ignored .browser-cache. Checks use SONARORAAAH_PYTHON explicitly; no assertions or native-tab behaviour are changed.

Production browser inspection: loaded illustrative example and compared all three strategies. Observed 6.25%, 0%, 0% essential shortfall risks, R384.38 / R362.50 / R362.50 expected ending balances and 100% / 75% / 75% purchase likelihoods. Mockup percentages are not actual outputs for this example.

Final redesign checks and ten screen captures are pending implementation. Foundation checks are recorded separately when run; they do not establish completion of the redesign.

## Configured original baseline

Reran the untouched `develop` source in `/tmp/sonarora-original-baseline` with the installed tooling. `npm run check` exited 1 at cross-browser: WebKit failed `Keyboard reaches first workflow link`. Chromium and Firefox each passed 72/72 checks, the historical browser suite passed 18/18, and all preceding gate steps passed. This establishes the same WebKit failure on this Mac before the redesign; it does not excuse or skip the assertion. Complete log: `/tmp/sonarora-baseline-configured.log`.

## Foundation slice verification — approved commit 24654ad

This records verification of the first slice, subsequently approved and committed as 24654ad. It is not the final flow verification below.

- `npm run lint`: pass, zero warnings.
- `npm run typecheck`: pass, application and engine configurations.
- `npm test`: pass, 306 tests in 15 files.
- `npm run build`: pass.
- `npm run check`: exit 1 at cross-browser, the same WebKit `Keyboard reaches first workflow link` assertion. All earlier gate steps passed, including Chromium 72/72, historical 18/18 and Firefox 72/72.
- Chromium and Firefox: six axe scans each, zero reported violations. No browser exceptions or external network requests reported. Automated scans are not complete WCAG certification.
- Rendered semantic text/background, button and three risk-colour pairs meet the retained 4.5:1 check. The contrast test now reads actual CSS tokens rather than old dark-theme constants.
- Captures at 360px and 1280px: no horizontal overflow. Files under ignored `test-results/redesign-foundation/`: `foundation-360.png`, `foundation-1280.png` and corresponding `-viewport.png` files. Inspected both full captures and first viewports. Mobile retains the long original page composition until the input/layout slice.
- `git diff --check`: pass. No changes to `src/engine/`, `src/application/` or `reference/R51/`.

Intermediate checks caught a Firefox hover-contrast regression; corrected the shadcn primary hover to use an explicit darker token. An initial font import referenced a subset entry absent from the installed package; corrected to its actual CSS entry. The new contrast reader initially did not handle minified three-digit hex; added support and reran the complete gate. None of these intermediate failures is presented as passing.

Impeccable guidance was read directly from the user-selected repository because the launcher was unavailable. An independent foundation review found no material active-UI defect and requested the verification record and a historical/current distinction in architecture documentation; both have been added. At that foundation review, the split layout, donut, comparison and purchase screens, additional controls and final captures were still pending. The completed flow and latest compactness changes are recorded below.


## Final flow and plain-English compactness review — 25 October 2026

User-directed changes now implement the five screen states and subsequent request for simpler labels, less white space and smaller cards. Cash and bank fields sit directly above the bill in one independent column; expected payment and stock sit in the other. Optional details and Money Map expand on request. The three strategy cards show compact individual rings, short summaries and full metric disclosures. The waiting strategy is labelled “Wait until after bill day” so its name matches its retained timing behaviour. “Receipt” is presented as “payment”. Original validation messages are unchanged.

Loading uses the same wordmark, thin indeterminate bar and “Loading…” language for boot and both calculations. Work has no forced delay. Only the screenshot harness slows callbacks to make transient loading inspectable. Initial boot uses lightweight HTML before React is ready; subsequent checks use the shared in-panel component.

| Check | Final result |
| --- | --- |
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass, application and engine configurations |
| `npm test` | Pass, 309 tests across 16 files |
| `npm run build` | Pass |
| `npm run check` | Exit 1 at cross-browser; the inherited WebKit native-Tab assertion still fails |
| Chromium / Firefox application checks | 73/73 each |
| Historical browser | 18/18, reference hash verified |
| Configured axe scans | Six each in Chromium and Firefox, zero reported violations |
| `npm run gate:self-test` | Pass: deliberate assertion failure stops before reference/build |
| `npm run accessibility:self-test` | Pass: injected unlabelled input causes the expected accessibility failure |
| `scripts/redesign-browser.py` | 36/36 checks pass, including tables, legend, input invalidation, clearing and loading |
| Default money workspace at 1280×900 | Entire page fits without vertical scrolling |
| Comparison cards at 1280×900 | All three fit in the first viewport |
| 360px / 1280px captures | All five screens plus loading checks captured; no horizontal overflow |

The configured original baseline and final flow both fail the same WebKit `Keyboard reaches first workflow link` assertion. This is a failing full gate, not a fully passing release. No assertion was skipped, and no blanket tabindex workaround was added. Automated scans do not establish complete WCAG certification. Phone content still scrolls to retain readable inputs and touch targets.

Final logs and captures are local and ignored under `test-results/redesign/`: `quality-check.log`, `build.log`, `gate-self-test.log`, `accessibility-self-test.log`, `capture-check.log`, `results.json`, and `01-loading`, `02-home`, `03-compare`, `04-purchase`, `05-details` PNGs at 360px and 1280px. `review.html` displays the supplied mockup beside each implementation capture. Purchase-loading component crops and context screenshots now contain the actual indicator; earlier lower-form-only captures were replaced.

The final independent verdict pass scored its listed copy and loading-capture fixes resolved. Its scope was those findings, not an unbounded certification. The design documenter updated `DESIGN.md` and the descriptive token sidecar `.impeccable/design.json`.

No financial-engine or `reference/R51/` files changed. The adapter changes present already-calculated values and explanations, including explicit ties; React contains no new financial calculations. Current source still rejects unregistered modules, unsafe capabilities and UI-to-engine bypasses. No runtime external requests, application storage or browser exceptions were reported by the final browser checks.

The foundation is committed. The flow/copy changes remain uncommitted for the required user review. Nothing has been pushed. A PR description will be supplied only after push approval, as requested.

## Step-by-step review: Money Map placement

Removed Money Map from Your money at the user’s request. It is available only on Compare options. Verified in Chromium at 360px and 1280px, including its table and Day 30 closing event. Refreshed both home captures. Lint, both TypeScript checks, all 309 unit tests and build pass. The redesign browser script now checks the map’s absence from the home panel and tests it on Compare options. This narrow update did not rerun the full cross-browser gate.
