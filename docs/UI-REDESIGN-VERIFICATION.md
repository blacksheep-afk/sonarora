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

Loading uses the same wordmark, thin indeterminate bar and “Loading…” language for boot and both calculations. Updated 26 October: startup and every calculation now remain loading for at least five seconds at the user’s request. This supersedes the earlier no-delay policy; the screenshot harness uses the real application timing. Initial boot uses lightweight HTML before React is ready; subsequent checks use the shared in-panel component.

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

## Step-by-step review: readable comparison list

The List view now keeps a readable 880px minimum table width inside a horizontally scrollable, named, keyboard-focusable region. Labels wrap at word boundaries; numeric cells do not wrap. The page itself does not overflow. Verified in Chromium at 360px, 390px, 810px and 1280px: all three options remain, numeric text stays on one line, narrow layouts scroll by keyboard and four configured axe scans report zero violations. Captures: `test-results/redesign/comparison-list-{width}.png`. Lint, application/engine TypeScript, all 309 unit tests and build pass. Only the first visual-review finding was addressed; tablet workspace density and risk-colour meaning remain separate review items.

## Step-by-step review: tablet workspace

The form and result panels now stack at 1024px and below, giving tablet inputs the full workspace width. Compact tablet-only spacing keeps the main form action visible at 810×777 while preserving 44px controls. Verified 810×777, 1024×900, 1025×900 and 1280×900 in Chromium: correct stacking/side-by-side boundary, readable tablet field widths, no horizontal overflow, and four configured axe scans with zero reported violations. The action ends at 770.9px on the 777px-high tablet viewport. Lint, both TypeScript checks and build pass. Existing phone rules and desktop side-by-side layout remain. Captures are `test-results/redesign/tablet-workspace-{width}.png`.

## Payment dropdown and scrollable details modal — 26 October 2026

Replaced the payment-likelihood toggle buttons and exact-value control with one native dropdown. Presets retain the corresponding numeric engine inputs, including explicit zero/one assumptions, and are labelled as guesses rather than guarantees. The primary page explains the prototype’s two-week input period: day 1 is tomorrow and day 14 is two weeks from today.

More details is now a shadcn dialog with an internally scrolling body and visible header/Done action. Its portal stays within the controlled form; draft edits remain in memory on close. Focus is trapped, Escape restores the trigger, and validation opens the modal for invalid extra fields. Opening the popup does not change workspace height. The separate exact payment-probability field is absent from the main page and modal.

Verification: lint, both TypeScript configurations, architecture guard, build and all 311 tests pass. Final quality gate passes Chromium 74/74, Firefox 74/74, historical browser 18/18 and six axe scans per Chromium/Firefox family, then exits 1 at the unchanged WebKit native-Tab assertion. No assertion skips or tabindex workaround. Additional Chromium checks at 360px, 810px and 1280px verify dropdown-only input, date explanation, stable background page height, internal scrolling, focus trap/Escape, note retention, synchronous financial-result invalidation and zero reported axe violations with the dialog open. Captures were refreshed at these widths under `test-results/redesign/02-home-*` and `05-details-*`. Logs: `dialog-browser.log` and `dialog-quality-check.log`.


### 26 October — calmer error handling

Validation now shows one actionable detail first, with the remaining issues in a collapsed native disclosure. Messages use plain instructions, retain field associations and omit internal paths. Unexpected failures preserve draft values and offer a retry. Unit coverage includes retry recovery, collapsed validation, and opening/focusing an extra field from an error link.

Validation: 313 unit tests passed; lint, typecheck, architecture checks and production build passed. Focused Chromium checks at 390px and 1280px verified collapsed errors, no horizontal page overflow, and modal focus recovery. Axe found zero violations on each error-state page after correcting notice-link contrast. These focused checks do not constitute physical-phone or screen-reader testing, or a rerun of the full cross-browser gate.


### 26 October — one-view money page

The main actions now share a row, and desktop spacing is tighter while retaining the input hints and prototype notice. Focused Chromium checks confirmed the empty and example-loaded home page fits without document scrolling at 1280×720, 1366×768 and 1440×900. The details modal opens without extending the page. At 390px the layout keeps readable fields and uses vertical scrolling; additional errors, expanded content and larger text may also need scrolling. The desktop example-state axe scan found zero violations. All 313 unit tests, lint, typecheck and production build passed.


### 26 October — revised loading timing

The latest request supersedes the earlier shared timing policy: startup now uses three seconds, and the home result has no loading indicator or artificial wait. The separate comparison and purchase screens retain their five-second timing. Focused Chromium verification measured startup at 3.31 seconds and the example home result at 98 milliseconds with no loader observed. All 313 unit tests, lint, typecheck and production build passed.


### 26 October — startup-only loading

The latest screenshot feedback removes branded loading from the comparison and purchase screens as well. All calculations now run without an artificial delay. Comparison pending states no longer show the changed-input empty state. The three-second startup splash remains. All 313 unit tests, lint, typecheck and build passed; focused browser verification checks immediate comparison and purchase results without an in-app loader.


### 26 October — purchase-check popup

The continue action now opens the supplier, payment and bill inputs in a dialog rather than extending the purchase page. The dialog retains entered values when closed and keeps validation/failure notices inside its focus boundary. Focused Chromium and WebKit checks at 1280px and 390px verified unchanged page height, internal scrolling, input-error focus, calculation results, retained values, Escape focus restoration and zero axe violations. All 314 unit tests, lint, typecheck and build passed. The complete cross-browser gate was not rerun.
