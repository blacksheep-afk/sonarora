# Sprint 4 accessibility and financial-communication audit

Status: improvements verified in Chromium-family and Firefox; **Sprint 4 is blocked by WebKit keyboard navigation**. Chief instructed that the proposed tabindex change remain unapplied. No complete WCAG certification or release approval is claimed.

## Scope and method

Reviewed the existing UI, labels, explanations, three comparison cards, Money Map events and staged-purchase states. Retained system-ui and the established #10251f / #eaf5ef / #b8dfcb palette. Tested the built application with Playwright 1.64.1. Chief explicitly approved exact-pinned axe-core 4.14.0 as a development dependency after review: MPL-2.0, no package dependencies, no lifecycle scripts run during installation. It is injected only by the browser test harness, never imported by application modules.

Axe runs the wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa and best-practice tags. Six states per passing browser: empty desktop; invalid mobile with long descriptions; comparison desktop; locked later purchase mobile; feasible staged desktop; 200% text at 320 CSS pixels. Chromium-family and Firefox each report zero violations and zero incomplete checks in those six captured scans. WebKit stops before axe; no WebKit scan is claimed.

See [axe-core documentation](https://github.com/dequelabs/axe-core) for the automated tool's scope. Results cover the configured rules and tested states, not every WCAG requirement.

## Findings and changes

| Finding | Change/evidence | Status |
| --- | --- | --- |
| Error links could point into a closed disclosure without restoring focus | Open ancestors and focus the linked control; global errors/failures focus a summary; failure recovery returns to cash | Fixed; rendered UI and Chromium/Firefox browser tests |
| Required day errors mixed scenario and reported-receipt ranges | Scenario errors say 1–14; reported receipt says whole Day 0 or later | Fixed copy; validation policy unchanged |
| Money Map selection could remain outside a shrunken outcome list | Clamp the displayed selection to the first current branch | Fixed view-state defect; engine outcomes unchanged |
| Some links, summaries and checkbox labels were below a 44px target height | Native controls retain semantics; minimum heights/padding increased | Verified active targets in Chromium/Firefox |
| Very long descriptions needed reliable wrapping | Inherited overflow-wrap and flexible field layout | Verified 390px long unbroken description |
| Wait and rounding warnings were buried in assumptions | Visible wait-card warning and R51 rounding disclosure beside comparison/staged results | Fixed communication |
| Plain Tab skips workflow links in local WebKit | Unchanged Tab assertion fails; proposed tabindex zero fix declined by Chief | **Open release blocker** |

All original 288 Vitest tests remain, with 18 additional tests (306 total): seven UI/focus/copy cases and eleven capability/dependency cases. None of the 40 inherited application browser assertions was deleted, skipped or converted to an expected failure.

## Keyboard, reading order and status

Native labels, legends, fieldsets, details/summary, lists and buttons remain. Chromium/Firefox tests verify initial workflow Tab order, a visible 3px focus outline, Enter disclosure/submission, field error association, focus recovery and heading order. Error/failure regions are focusable at tabindex -1; there are no positive tab indices. Result regions expose pending state through aria-busy. Browser aria snapshots are saved as reading-order.txt. These are not NVDA/JAWS/VoiceOver user tests or exhaustive keyboard-only task certification.

No tabindex zero change was applied after Chief declined it. WebKit currently focuses a different control instead of the first workflow link on the first Tab. The complete gate retains this failure. Background: [WebKit anchor keyboard-focus implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/HTMLAnchorElement.cpp) and [Playwright maintainers' discussion](https://github.com/microsoft/playwright/issues/5609). These references explain investigation context; they are not evidence that this application passed WebKit.

## Contrast, targets, enlargement and motion

Independent WCAG luminance calculation: #eaf5ef against #10251f is **14.39:1**; #b8dfcb against #10251f is **11.06:1**. Inverse primary buttons use the same 11.06:1 pair. Tested active text/focus palette exceeds 4.5:1; disabled and OS-native popup appearance are not universally certified.

Active visible controls and complete clickable checkbox labels are at least 44 CSS pixels high in tested states. No page horizontal overflow at 1280, 390 or 320 CSS pixels; 200% CSS text enlargement reflows at all three widths. The 320px layout is a 400%-reflow proxy relative to 1280px, not an executed OS/browser-chrome zoom test. Real device, forced-colors, physical touch and native 200%/400% browser zoom remain manual follow-up.

Reduced-motion media rules remove transitions/animation and use automatic scrolling. Computed reduced-motion behavior passes. No unnecessary motion was added.

## Financial distinctions audited

- Cleared cash/bank are separate from expected, uncertain receipts; unknown receipt dates exclude receipts.
- Probabilities and branch weights are reported assumptions, never predictions.
- Essential-payment risk excludes emergency-only debt; combined unpaid/net include emergency debt.
- Day 30 end cash differs from net after unpaid obligations; net is not spendable cash.
- Gross sales and modelled sales surplus are not profit.
- Receipt, balance, liability and supplier reports remain unverified; no bank/payment operation exists.
- Visible retained R51 rounding caveat: 50 cents x 0.29 can display R0.14 rather than decimal half-up R0.15; expected metrics round separately.
- Wait may buy after a missed bill; unpaid obligations remain visible.

No financial engine or frozen reference was changed. Wider assistive-technology, browser/device and user comprehension reviews remain open; Sprint 4 has not met its exit gate.
