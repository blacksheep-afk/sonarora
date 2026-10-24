# Ubuntu WebKit native-link diagnostic — review proposal

Status: prepared locally only. No commit, push, GitHub workflow dispatch or Ubuntu browser execution has occurred. Sprint 4 remains blocked. Chief/009 approval is required before remote publication or execution; only Chief may push.

## Proposed files

All six files are new and remain untracked/unstaged. No existing file was changed by this preparation.

1. `.github/workflows/webkit-native-focus-diagnostic.yml` — independent manual Ubuntu job.
2. `scripts/diagnostics/webkit-native-link/.gitattributes` — scoped byte-preservation rules for the fixture and original portable probe.
3. `scripts/diagnostics/webkit-native-link/linux-native-probe.py` — byte-for-byte copy of the existing portable diagnostic.
4. `scripts/diagnostics/webkit-native-link/native.html` — byte-for-byte copy of the accepted native fixture.
5. `scripts/diagnostics/webkit-native-link/verify-evidence.py` — source hashes, installed version/environment metadata and eight-observation result validation.
6. `docs/LINUX-WEBKIT-DIAGNOSTIC.md` — this review and execution interpretation guide.

Local review logs and controlled failure fixtures are under ignored `tmp/linux-webkit-actions-review/`; they are not proposed Git additions.

## Workflow behavior and dependencies

Trigger: `workflow_dispatch` only. No push, pull request, schedule, workflow-call or production-gate trigger is added. One job runs on `ubuntu-latest`, with a 20-minute timeout and explicit Bash shell. It does not invoke the Sonaroraaah application, financial engine, production quality gate or original browser tests.

Actions: `actions/checkout@v4`, `actions/setup-python@v5`, `actions/upload-artifact@v4`. These are GitHub-owned major-version references, matching the existing checkout/Python style; they are not immutable action commit pins. Python is requested as 3.13, consistent with existing CI. Actual Python, OS and kernel versions are retained. Ubuntu's `latest` image, Python patch releases and Playwright's transitive dependencies can change; package freeze and bundled-driver metadata are collected rather than claiming those are pinned.

The Playwright package itself is exact-pinned and checked at runtime:

```bash
python -m pip install --disable-pip-version-check playwright==1.64.1
python -m playwright install --with-deps webkit
```

The workflow uses these commands with `2>&1 | tee ...` for installation logs. The explicit GitHub Actions Bash shell applies `-e -o pipefail`, so a failed installer cannot be hidden by successful `tee`. There is no fallback package version, private preference, custom browser binary or ignored installation error. If the exact package cannot be resolved or Linux dependencies/browser installation fails, the workflow fails.

Supported installation reference: [Playwright browser/system dependency installation](https://playwright.dev/python/docs/browsers#install-system-dependencies). Command failure behavior: [GitHub workflow syntax and shell exit handling](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#exit-codes-and-error-action-preference).

## Exact fixture and experiment

The fixture contains native elements in this DOM order:

```html
<a href="#target">First link</a>
<button>Second button</button>
<input aria-label="Third input">
<div id="target">Target</div>
```

Exact source-byte SHA-256 values:

- `native.html`: `cffd8991304e3f5a2028b4e4de0869c38772ebe399444ae992148dbf67832f73`.
- Original `linux-native-probe.py`: `9b089012e73d18f64c01892993af1ef97a4e5ce54a0977c38018e665cc2ecfa1`.

Scoped `-text` Git attributes prevent line-ending conversion of either source. The helper verifies these hashes before package installation and again before browser installation. This preserves the exact Windows-tested fixture on Linux without changing the repository's global attributes.

The unchanged portable probe serves the document through a loopback HTTP server, launches public Playwright WebKit with `headless=True`, and records eight plain `Tab` presses at 1280 × 900. Each observation follows two animation frames and includes the active tag, text and `document.hasFocus()`. There are no explicit tab indices, programmatic focus calls, application imports or financial calculations.

## Permissions and remote capabilities

- Workflow token has `contents: read`; unspecified permissions are disabled.
- Checkout uses `persist-credentials: false` and `clean: false`.
- No secrets, personal access tokens, SSH keys, OIDC, environments or additional write permissions are requested.
- No deployment, release, merge, branch/settings modification, Git write or remote dispatch command exists.
- GitHub-owned actions check out source, provide Python and upload diagnostic artifacts. Supported browser installation may install OS packages on the future ephemeral Ubuntu runner; it is not executed locally by this preparation.
- Network use is limited by the prescribed tools' normal operation: GitHub actions/source/artifacts, Python packages, browser downloads and Ubuntu dependencies. No customer data is used and no application is served.

The artifact upload runs under `always()` and uses `if-no-files-found: error`. Earlier failed steps remain failed. If failure occurs before useful evidence exists, artifact upload may also fail; it cannot turn the run green. No `continue-on-error` or success-forcing shell expression is present.

## Downloadable evidence and interpretation

Artifact name: `ubuntu-webkit-native-focus-<run_id>-<run_attempt>`, requested retention 14 days (subject to repository policy).

On a completed diagnostic, it contains:

- Checkout commit, OS release and kernel information.
- Exact source hashes, Python/Playwright versions and bundled driver package version.
- Installed Python package freeze.
- Playwright and WebKit/system installation logs.
- Exact diagnostic fixture and portable probe.
- `focus.json`: actual WebKit version, environment and all eight observations.
- `probe-stderr.log`: browser/import/runtime diagnostics.
- `interpretation.json`: observed tags, whether the first Tab reached the native link and whether any of eight Tabs reached it.

Failure artifacts contain whatever logs/results were produced before failure. Browser-launch failure is a nonzero probe exit with a machine-readable blocked result where initialization permits. The validator also fails for blocked status, a wrong package version, absent browser version or a sequence other than eight valid observations.

A successful diagnostic job means evidence collection completed. It does **not** mean link accessibility passed. If links are skipped, interpretation fields explicitly remain false. A native-link result cannot grant application compatibility or Sprint 4 acceptance. The application's two existing failing Tab assertions remain unchanged.

Compare the future Linux sequence against Windows WebKit 27.2's headed/headless sequence:

`BUTTON → INPUT → BODY/outside document → BUTTON → INPUT → BODY/outside document → BUTTON → INPUT`.

A Linux link-reachable result would narrow the issue toward environment-specific behavior, subject to the recorded browser/driver versions. A matching skip would strengthen evidence for broader behavior. Neither is yet known.

## Local checks actually executed

Fifteen local check groups passed; one tool-availability limitation was recorded:

- Both new Python files compile without writing bytecode.
- Fixture and portable probe match original bytes and full SHA-256 hashes.
- Existing installed Playwright 1.64.1 is verified and its Windows/driver metadata recorded.
- Wrong Playwright version and one-byte fixture tampering are rejected.
- Validator accepts a complete previously captured **Windows** record without claiming Linux execution, and explicitly reports that the native link was skipped.
- Blocked status and truncated observations produce nonzero validator exits.
- An actual controlled missing-browser launch produces a nonzero exit and blocked JSON. It uses an intentionally absent cache path and installs nothing.
- Workflow trigger/permission/dependency/failure policies pass structural review.
- Original probe still uses eight plain Tabs; no inserted tabindex or `.focus()`.
- `git check-attr text` confirms both preserved source files have `text: unset`.
- Existing Git Bash `-n` accepts all seven workflow command steps. Installation commands were syntax-checked, not executed.
- A real `false | tee /dev/null` negative control under Bash `-eo pipefail` exits nonzero.

No `actionlint` or full YAML parser is installed. The existing Git Perl runtime lacks `CPAN::Meta::YAML`; this was recorded as unavailable. Therefore full YAML/schema/action semantic validation is not claimed. YAML structure/indentation, allowed keys/steps, official action inputs and shell syntax were reviewed. No tools were installed to hide this limit.

Evidence: `tmp/linux-webkit-actions-review/local-checks.json`, controlled-failure output, extracted shell scripts, attribute output and `yaml-parser.log`. No Linux or remote GitHub Actions success is claimed. The full application quality gate was not rerun because no application or existing gate files were changed.

## Preserved baseline

Branch remains `develop`; HEAD remains `88714e1cfd8acd797a4f5e577f2345f1afbeaf73`; origin remains `https://github.com/blacksheep-afk/sonaroraaah.git`.

All 23 previously staged files remain staged with identical working-file bytes and an identical staged binary diff. Staged patch SHA-256: `2b9b91df647b38edb441110cad779c075b9c2d68ad86fa28b61c44a281de33d9`. Their pre-existing staged status is preserved; the working tree additionally contains only the six proposed untracked files above.

`git diff HEAD -- src/engine reference` remains empty. No `tabIndex={0}` was added. No historical R19/R37/R51 artifact or financial behavior was changed.

Protected R51 hashes rechecked using `node scripts/check-reference.mjs`:

- Original and embedded HTML: `ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d`.
- Original evidence ZIP: `79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe`.

Final local evidence inventory, baseline preservation and reference checks are under `tmp/linux-webkit-actions-review/`.

## Stop point for Chief and 009

Review these six files before any publication or execution. [GitHub requires a workflow_dispatch workflow to exist on the default branch](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatch) before it receives manual-dispatch events. Publication/registration may therefore require a separately approved default-branch change, not merely pushing an arbitrary diagnostic branch. No such push, merge, branch change or settings change is authorized or performed here.

This preparation stops at the requested approval gate. No commit, push, GitHub Actions trigger, deployment or Sprint 4 acceptance has occurred. The investigation success criterion—an actual verifiable Ubuntu WebKit focus sequence—remains pending.
