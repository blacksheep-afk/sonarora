# Sprint 4 cross-browser results

Status: **not release-ready**. All three browser families actually executed locally on Windows; WebKit failed. No installation failure or unsupported environment is being substituted for this application keyboard failure.

| Browser/runtime | Actual result | Accessibility scans | Viewports exercised |
| --- | --- | --- | --- |
| Chromium-family 155.0.4283.62 (local launcher prefers installed Edge) | 72/72 assertions passed | 6 scans, 0 violations, 0 incomplete | 1280, 390, 320; 200% CSS text at each |
| Playwright Firefox 157.0 | 72/72 assertions passed | 6 scans, 0 violations, 0 incomplete | 1280, 390, 320; 200% CSS text at each |
| Playwright WebKit 27.2 | Failed after the first blank-session assertion, at Keyboard reaches first workflow link | Not reached; no axe pass claimed | Initial 1280px page only; mobile workflow not reached |
| Unchanged original R51 browser suite | 18/18 assertions passed in its Chromium-family setup | Original suite, separate historical evidence | 1280, 390 |

The passing 72 assertions comprise all 40 retained Sprint 3 assertions plus 32 new hardening assertions. Repeated assertions across browsers are not 144 distinct financial scenarios. The engine's existing independent/parity tests provide financial evidence separately.

## Exact open blocker

With default local WebKit keyboard behavior, the first plain Tab focuses the **Load illustrative example button**, skipping the first workflow link. The unchanged assertion expects 1. Your inputs. The test fails and records browser version, failure-detail.json and failure.png.

The proposed application change was explicit tabindex zero for native interactive elements, preserving DOM order. The execution request was rejected before it ran; Chief then explicitly instructed: **leave it unapplied and report the blocker**. No such change, Alt+Tab substitution, skip, expected-failure annotation or browser exclusion was applied. The only tabindex values added by current hardening are -1 on error/failure regions for programmatic recovery.

The mandatory cross-browser stage returns 1 and therefore npm run check returns 1. No Sprint 4 local commit or complete exit-gate claim is made.

[WebKit's native anchor-focus code](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/HTMLAnchorElement.cpp) and [Playwright's keyboard discussion](https://github.com/microsoft/playwright/issues/5609) informed investigation; they do not turn this failing application test into a pass.

## Tooling, artifacts and limits

Existing Python Playwright remains 1.64.1. Matching Firefox build 1555 and WebKit build 2370 downloaded successfully to ignored .browser-cache; associated FFmpeg/Winldd downloads also succeeded. No browser was marked passing on installation alone.

Run npm run test:browser for the primary browser and npm run test:cross-browser for Firefox/WebKit. The wrapper uses SONARORAAAH_PYTHON when supplied, otherwise the bundled Windows runtime or python; .python-deps is prepended to PYTHONPATH. For installation/reproduction, set PLAYWRIGHT_BROWSERS_PATH to the repository .browser-cache before python -m playwright install chromium firefox webkit. CI declares that path and installs supported system dependencies; remote CI was not executed or pushed.

Per-family evidence: test-results/application/results.json, test-results/application-firefox/results.json and test-results/application-webkit/results.json. Successful runs record version, complete assertion names and axe summaries; failed runs record status/error and cannot reuse a stale passing JSON. test-results/cross-browser.json aggregates actual child exit codes. Screenshots and axe JSON remain ignored development evidence.

These are Playwright desktop-engine runs at representative widths, not physical iPhone/Android tests or installed macOS Safari certification. The enlarged-text test is CSS-based; 320 CSS pixels is a reflow proxy, not native browser-chrome zoom execution. Assistive-technology user tests remain outstanding.
