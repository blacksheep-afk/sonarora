# Local redesign verification

## Baseline — 25 October 2026, Node 24.18.0

Clean ui/redesign branch from develop. npm ci succeeded.

Initial npm run check: **exit 1**, at application-browser (`spawnSync python ENOENT`). Lint, application TypeScript, engine TypeScript, all 306 tests in 15 files, reference checks, architecture checks and production build passed. Missing local Python/Playwright configuration is a tooling failure, not a passing browser gate. Complete output retained locally in /tmp/sonarora-baseline.log.

Subsequently located Python 3.13 and installed the pinned requirements-browser.txt dependencies into ignored .python-deps. Browser binaries are installed into ignored .browser-cache. Checks use SONARORAAAH_PYTHON explicitly; no assertions or native-tab behaviour are changed.

Production browser inspection: loaded illustrative example and compared all three strategies. Observed 6.25%, 0%, 0% essential shortfall risks, R384.38 / R362.50 / R362.50 expected ending balances and 100% / 75% / 75% purchase likelihoods. Mockup percentages are not actual outputs for this example.

Final redesign checks and ten screen captures are pending implementation. Foundation checks are recorded separately when run; they do not establish completion of the redesign.

## Configured original baseline

Reran the untouched `develop` source in `/tmp/sonarora-original-baseline` with the installed tooling. `npm run check` exited 1 at cross-browser: WebKit failed `Keyboard reaches first workflow link`. Chromium and Firefox each passed 72/72 checks, the historical browser suite passed 18/18, and all preceding gate steps passed. This establishes the same WebKit failure on this Mac before the redesign; it does not excuse or skip the assertion. Complete log: `/tmp/sonarora-baseline-configured.log`.

## Foundation slice verification

This is verification of the first uncommitted slice, not the finished five-screen redesign.

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

Impeccable guidance was read directly from the user-selected repository because the launcher was unavailable. An independent foundation review found no material active-UI defect and requested the verification record and a historical/current distinction in architecture documentation; both have been added. The complete split layout, donut, comparison and staged screens, additional controls, ten final screen captures and final delivery checks remain pending.
