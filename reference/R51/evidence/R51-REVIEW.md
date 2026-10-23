# MOYA R51 — Stale Comparison Repair

**Status:** Local review candidate, not deployed. R19 remains production; R37 frozen; R46 and all prior artifacts unchanged.

## R50-01 correction
R46 updated its three-choice comparison on form `change` or submission, leaving old financial results visible during `input` editing. R51 adds a form-level `input` listener that immediately removes the old scenario summary, decision cards, detailed metrics and outcome paths, and shows an `aria-live` warning: the comparison must be recalculated. On `change` or Compare choices, the existing calculation flow still renders a fresh result. Reset rebuilds the original example. Safe-to-Buy's preexisting change-invalidation remains in place.

## Reproduced validation
- Original R46 source SHA-256: `ada253d2951b6432962596dcc7e0350f37b68030f01cb37d2b146cb3fea0cce2`.
- New R51 HTML SHA-256: `ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d`.
- Packaged Node adversarial: **2,541/2,541** passed.
- Packaged simulated DOM: **82/82** core/UI, **51/51** Safe-to-Buy, **21/21** R41 comparisons, **5** precision assertions passed.
- Chromium real browser on **1280px and 390px**: **10/10** checks each, covering initial render, immediate invalidation during edit, warning, cleared details, change recalculation, invalid input, reset, absence of horizontal overflow and page errors. Run `python R51_BROWSER_TEST.py` where Playwright and Chromium are available.

## Limits
These tests do **not** prove all input sequences, financial correctness or accessibility conformance. Screenshots alone are not acceptance evidence. Entered balances, receipts, liabilities and supplier terms remain unverified by banks/suppliers. Independent human review and accepted support ownership remain unavailable. No release or score change authorized. Internal score **62/70**.

## Files
`index.html` is the standalone R51 demo. Run `RUN_R51_NODE_TESTS.cmd` on Windows with Node.js; the two bundled .js scripts are inherited R46 tests applied to the R51 HTML. `R51_BROWSER_TEST.py` is the additional Chromium regression.
