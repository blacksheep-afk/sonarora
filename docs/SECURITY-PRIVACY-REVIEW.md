# Sprint 4 security and privacy review

This is a scoped source/dependency/browser review, not a penetration test or a guarantee of security.

## Application boundary

Inspected App, the application adapter/session routing, engine dependency policies, HTML entry point and test/runtime configuration. Production dependencies remain exactly React 19.3.1, react-dom 19.3.1 and zod 4.6.7. No authentication, banking API, payment handling, backend, analytics, database or persistence was added.

The engine and frozen references are unchanged from Sprint 3. React consumes only the approved application modules. The engine still compiles without DOM, React or Node ambient types; application adapter modules cannot acquire React/DOM/network/storage capabilities.

## Findings and evidence

| Area | Result and limits |
| --- | --- |
| Network | Built-app Chromium/Firefox workflows report no external requests; production assets are served only from the test origin. Exact origin comparison replaces a URL-prefix check. Registry/browser downloads are development tooling, not application runtime requests. |
| Storage | Tested workflows leave localStorage, sessionStorage and cookies empty. Static policy rejects localStorage, sessionStorage, indexedDB and cookie access. IndexedDB/cache persistence is inspected statically, not exhaustively monitored across every browser facility. |
| User data rendering | Money drafts are native controlled input values; errors/reasons are structured text rendered by React. No application unsafe HTML sink was found. |
| Dynamic execution | Application policy rejects eval, Function, dynamic imports, string-code timers and known computed capability accesses. |
| Unsafe HTML | Added rejection/tests for innerHTML, outerHTML, insertAdjacentHTML, dangerouslySetInnerHTML and srcDoc. |
| Credentials | No credentials were introduced. Final staged review checks credential signatures, forbidden artifacts and intended inventory; see Sprint 4 report for final result. |
| Stale outputs | Session/revision/request checks remain; rapid edits, repeated requests, reset/refresh/navigation and unexpected adapter failures are tested. |
| Financial claims | No automatic recommendation, bank verification, supplier approval, payment execution, trained-ML or endorsement claim is added. |

The AST policy is conservative, not a complete sandbox: computed obfuscation, hostile dependencies and arbitrary injected JavaScript are not comprehensively proved safe. No server exists on which to assess production hosting headers, authentication or authorization.

## Approved dependency review

Chief explicitly approved **axe-core 4.14.0** after reviewing exact version, MPL-2.0 and absence of package dependencies. Installation used npm install --save-dev --save-exact axe-core@4.14.0 --ignore-scripts. Its integrity in package-lock.json corresponds to the reviewed npm artifact:

sha512-9WTZxEjsZ7b13TH8JPmbV2z8CHbl80/2hm3XPEG4JgNdQLK81IBRXmSxHfMAOkSqQeRxT/0dwNDz2GOm3zzpcQ==

It is test-only; no application import is allowed. No production package was added or upgraded. Playwright remains the already approved 1.64.1 Python version; matching Firefox/WebKit/FFmpeg/Winldd test binaries were downloaded to ignored .browser-cache.

The installation audit and separate npm audit --omit=dev both reported **zero known vulnerabilities** on 2026-10-24. This reflects the registry's response at that time, not proof of absence of vulnerabilities. npm ci --ignore-scripts reproduced the lockfile successfully. [axe-core source/license](https://github.com/dequelabs/axe-core) was reviewed alongside npm metadata.

## Privacy and operational limits

Financial state is memory-only. Reload/reset loses it; no report is independent bank verification. Browser artifacts contain invented examples, not customer records. Logs, screenshots, browser caches, dependencies, .python-deps, build output and secrets are ignored rather than staged. Test tooling injects axe into local test pages; that is separate from production application code.

The CI configuration has read-only repository permissions and now declares browser installation and negative controls. Nothing was pushed, deployed or remotely executed. WebKit keyboard failure remains a release blocker by Chief's instruction; the gate must continue failing rather than suppress it. No Sprint 4 commit is authorized while mandatory checks remain failing.
