# Operation 009 — Sonaroraaah Sprint 0 recovery report

Date: 2026-10-23, Africa/Johannesburg.

**Recovery successful. Local verification passed. Sprint 0 remains incomplete pending evidence review and branch-governance verification.** No commit, push, deployment or Sprint 1 work was performed.

## Preserved checkout

- Directory: `C:\Users\Sibusiso Nkosi\OneDrive\Documents\ChatGPT\Sonaroraaah\sonaroraaah-sprint0`.
- Branch: `develop`, unborn; no commits exist and there is no last commit SHA.
- Fetch and push origin: `https://github.com/blacksheep-afk/sonaroraaah.git`.
- All 21 expected foundation/configuration files were found. `recovery-inventory.json` records their full hashes and sizes at recovery before edits. There was no pre-restart signed inventory; this establishes survival and the recovery baseline, not proof against an unavailable earlier snapshot.
- The copied historical reference, evidence ZIP, extracted scripts, lockfile, dependencies and generated build survived. Existing files were not reset, cleaned, discarded or replaced wholesale. The checkout was not recloned.
- During recovery, only three of those 21 files were edited: `eslint.config.js` excludes generated Python tooling; `package.json` exposes the architecture check; `scripts/quality-gate.mjs` runs that check before build. New architecture/evidence/report files were added. Application source and historical artifacts were unchanged during this recovery.

## Dependency recovery

Node v24.16.0; npm 11.13.0. The surviving npm debug log `2026-10-23T19_40_16_633Z-debug-0.log` identifies `npm ci` in this checkout and ends with exit 0 / info ok. `npm ls --depth=0` found all 15 declared direct dependencies at their locked versions. A new clean install was therefore not necessary.

Playwright had not survived as an installed dependency; `.venv` was an incomplete setup. Installed Python Playwright 1.64.1, greenlet 3.5.6, pyee 14.0.0 and typing-extensions 4.16.0 into ignored `.python-deps` using the approved network installation. The bundled Python 3.12 runs it with `PYTHONPATH` pointing there. The packaged runner used installed Microsoft Edge (`channel: msedge`); no separate Chromium download was needed. `.venv` was left intact.

## Actual verification results

| Check | Result |
| --- | --- |
| Existing clean-install evidence | npm ci exit 0 confirmed from surviving npm log; not rerun |
| Lint | Passed, warnings disallowed |
| TypeScript | Passed, strict no-emit check |
| Vitest | 1 test file, 2 foundation tests passed |
| R51 adversarial regression | 2,541 passed, zero failed |
| R51 DOM adapter | 82 inherited core/UI and 51 Safe-to-Buy checks passed |
| R51 strategy comparisons | 21 matched |
| R51 precision/bounds checks | 5 passed |
| Architecture | Passed: foundation-only source inventory, allowed imports, direct network/storage guard, Sonaroraaah branding |
| Production build | Passed; 17 modules transformed |
| Full npm run check | Exit 0 |
| Intentional failure | Injected assertion failed; child quality gate exit 1 at test stage; no reference/build execution |
| Negative-control wrapper | Exit 0 means expected rejection confirmed; temporary test removed |
| Packaged R51 browser regression | 18/18 passed, exit 0; Edge, 1280px and 390px widths |
| Ignore rules | Dependencies, build, environment/secrets, temporary files and Python tooling excluded |

The initial sandboxed Vitest attempt timed out waiting for its worker and ran no tests. The initial sandboxed browser attempt did not return a result and was interrupted. Successful runs above used approved execution outside the sandbox. No failed attempt is counted as a pass.

Raw local outputs are retained in ignored `quality-gate.log`, `intentional-failure.log` and `r51-browser.log` beside this report. Commands: `npm run check`, `npm run gate:self-test`, and the original `reference/R51/evidence/r51_release_gate_check.py` using the bundled Python and `.python-deps` on PYTHONPATH.

## Reference integrity

| Artifact | Verified SHA-256 |
| --- | --- |
| Standalone R51 index.html | `ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d` |
| MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip | `79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe` |
| ZIP embedded/extracted index.html | `ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d` |

Rehashed original Downloads sources (`index (1).html` and the original ZIP) and repository copies; all expected hashes match. All 12 original ZIP entries match their extracted bytes, including every historical script and the R41 reference. `reference-integrity.json` records those full hashes. The extra evidence `package.json` is a previously added CommonJS execution wrapper, not part of the original ZIP. No historical source was edited. R19 and R37 were not accessed or modified.

The stated LEARNER path does not exist on this computer. Matching originals were recovered previously from this user's Downloads. The other Downloads `index.html` has a different hash and is not used. Historical MOYA filenames and text are deliberately retained. The application title and product metadata are Sonaroraaah.

## Remaining state and limits

All repository files remain untracked and uncommitted because this is an unborn branch. `GIT-STATUS-RECOVERY.txt` contains the complete final file list. Generated dependencies, Python packages, logs and builds are retained locally and ignored. No existing uncommitted application work was discarded; only the intentionally created failing-test sentinel was removed by its diagnostic.

The original `reference/R51/manifest.json` survived with its earlier `recovered-awaiting-regressions` status; the actual new regression results are recorded in this report without rewriting that historical recovery metadata.

Ready for final local evidence review. Still pending: user review of these mandatory gates; establishing and verifying the remote main release branch and its protection; remote CI verification. Main protection cannot be inferred from a local branch name. There is no commit or push result: neither was attempted under the resume restrictions. Remote authentication and current remote state were not retested.

These checks establish a foundation and checked historical behaviors, not a migrated engine, financial correctness proof, full security/accessibility review or product release. The architecture guard is a static source check. The browser suite tests original R51, not the new app. Sprint 1 remains stopped.

## Final local commit gate — 2026-10-23

The recovery sections above are a point-in-time record from before commit authorization. The user subsequently reviewed the technical evidence and authorized a local commit on develop only, with the message `chore: establish hardened Sonaroraaah Sprint 0 foundation`. Pushes, remote branches, repository-setting changes and deployments remain prohibited. Final Sprint 0 acceptance and Sprint 1 authorization remain outstanding.

Reviewed all 41 untracked files. Intended inventory: 10 root/CI/configuration files, 5 documentation files, 16 reference files, 5 quality scripts, 4 application files and 1 test file. The complete path inventory is in `GIT-STATUS-RECOVERY.txt`; its `??` prefixes are the preserved recovery status, not the post-commit status. No candidate file needed exclusion. Recovery inventories are deliberate provenance documents. Dependencies, `.python-deps`, `.venv`, temporary logs, build outputs, browser caches, environment files and secrets remain ignored and outside the intended commit. Pattern scanning found no credential signatures. Lockfile review found 197 resolved artifacts from registry.npmjs.org with SHA-512 integrity values and no credential-bearing URLs; this is not a comprehensive dependency security audit.

Re-ran the complete quality gate before staging: lint, strict TypeScript, 2 Vitest foundation tests, 2,541 adversarial checks, 82 core/UI checks, 51 Safe-to-Buy checks, 21 strategy comparisons, 5 precision/bounds checks, architecture guards and production build all passed; gate exit 0. Re-ran the negative control: one intentional assertion failure made the child gate exit 1 at the test stage before reference/build; diagnostic wrapper exit 0 and its temporary test was removed. Logs are retained locally as ignored `final-quality-gate.log` and `final-intentional-failure.log`. The earlier 18/18 packaged browser pass remains recovery evidence; it was not rerun for this commit gate because no application or historical source changed.

Full R51 standalone, ZIP and extracted HTML hashes were reverified against the expected values above; all 12 original ZIP entries still match their extracted files. Historical sources were not edited. Staging is limited to the explicit 41-path inventory and is reviewed independently from working files before committing. The commit ID and final working-tree result are reported after commit creation rather than embedded in their own commit.
