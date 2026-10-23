MOYA R51 PORTABLE EVIDENCE PACKAGE

Contents: original unmodified R51 index.html, original Node regression scripts,
portable Chromium browser test, Windows launchers and prior review materials.
R51 HTML SHA-256: ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d

1. Extract the entire ZIP into a folder. Do not run files from inside the ZIP.
2. Node checks: double-click RUN_R51_NODE_TESTS.cmd (Node.js required).
3. Browser checks: install Python and Playwright as needed:
   py -3 -m pip install playwright
   py -3 -m playwright install chromium
   Then double-click RUN_BROWSER_WINDOWS.cmd.
   The script tries Edge, Chrome and Playwright Chromium; no Linux-specific path.
   Optionally set MOYA_CHROMIUM to a Chromium executable path.
4. The browser runner checks the R51 HTML SHA-256 before testing.

The obsolete R51_BROWSER_TEST.py with a Linux-only browser path has been removed.
The corrected runner returns a nonzero exit status on assertion failure and the CMD
launcher captures the code immediately before displaying the saved log.
Use --self-test-fail to deliberately fail a test and verify the exit code;
this is a runner diagnostic, not a real R51 defect.

The original 36-assertion audit code was not provided in this package and cannot
be reconstructed as the same test. The portable suite is the previously reported
18-assertion check. The earlier 20/20 and 36/36 browser passes remain historical reports.

Passing is evidence for checked scenarios, not a human code review, full
accessibility audit or production authorization. R19 production and R37 frozen unchanged.
