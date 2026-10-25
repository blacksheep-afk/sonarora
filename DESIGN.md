# Sonarora interface design

This describes the implemented interface in `src/App.tsx`, `src/components/DecisionViews.tsx`, `src/components/LoadingState.tsx`, `src/style.css`, `src/application/adapter.ts`, `src/main.tsx` and `index.html`, with product constraints from `PRODUCT.md`.

## Purpose and direction

Sonarora helps South African informal traders and people with irregular income compare stock purchase timing against essential bills using their reported numbers and uncertain payment and sales assumptions. It is an independent hackathon prototype, not an official or endorsed FNB service. It verifies no accounts and moves no money. The direction is a calm, light workspace: navy type, teal actions, white panels, plain English and individual risk rings.

The latest compactness request takes precedence over the earlier large-icon direction: remove the blank area below cash, fit the default desktop workspace on one screen, and make comparison cards smaller. Optional information remains accessible through disclosures.

## Implemented layout

```text
Desktop: shell maximum 1440px
Sonarora                 1 Your money / 2 Compare options / 3 Check a purchase
Independent prototype disclaimer
Your money                              | Your result
Cash + bank       Expected payment      | Lowest chance / explicit tie
Essential bill    Payment day + chance   | Selected option ring + option list
Bill due day      Stock cost             | Compare all options
More details [closed]                   | Calculation disclaimer
Compare / Clear                         |

Compare options: Cards / List
Buy now | Wait until after bill day | Buy after payment arrives
Each card: compact title and copy + own ring; key points; full details [closed]
Rounding [closed] / purchase action / Money Map [closed] / model limits [closed]

Check a purchase
Four smaller-purchase steps | Your numbers + continue
Continue reveals supplier, bill, payment/balance and confirmation checks
```

The home workspace uses 1.05fr / 1fr panels. Its form uses two independent vertical columns: cash, bank and bill on the left; expected payment and stock on the right. A taller payment section therefore does not reserve empty space below cash. At 760px and below the workspace becomes one column and comparison cards stack. The two compact form columns remain; payment day and chance stack below 480px. Timelines scroll horizontally when needed.

Desktop comparison cards form a three-card row with 112px rings, reduced to 88px at intermediate desktop widths. Main rings are capped at 170px, becoming 118px or 108px on smaller screens. The default collapsed home layout and three comparison cards were reported visually checked at 1280 × 900 during this redesign. Expanded details, validation errors, increased text size and other viewports can require scrolling.

## Copy and financial meaning

Use concrete labels: “Cash you have”, “Payment you expect”, “Bill you must pay” and “What you want to buy”. Strategy names are “Buy now”, “Wait until after bill day” and “Buy after payment arrives”; engine keys remain now, wait and trigger.

The adapter presents existing engine percentages and identifies the lowest values, including two-way and three-way ties. Zero remains 0%. Each ring shows one option's chance of missing an essential bill; independent option risks are never combined into a segmented total. Strategy red, amber and green identify options consistently, not absolute risk thresholds, and accompany text and icons. A table alternative shows the same percentages.

Payment and bill inputs use relative Days 1–14 counted from today, not calendar dates. Outcomes can include Day 0; the example ends on Day 30. Two essential bills share one due day. Unknown payment timing excludes that payment. Waiting tries to buy once, the day after bills are due; later receipts cannot retroactively pay a bill on time. Emergency-cost shortfalls remain in the full figures, outside the essential-bill risk ring. Sales are before costs, not profit, and after-unpaid-cost figures are not spendable cash.

Unlikely / Maybe / Likely / Very likely explicitly map to 0.25 / 0.5 / 0.75 / 0.9, with accessible numeric labels and an exact-value input. These are choices, not invented probability defaults. More details retains the second bill, payment timing, priority, sales, probability relationship, emergencies and optional notes. Notes disappear on reload and do not affect calculations.

Prototype, unverified-input, non-advice and purchase non-approval warnings remain in context. The full R51 binary half-cent rounding limitation remains available in a disclosure; transaction paths retain integer cents. Every financial edit clears results and confirmations. The engine and reference/R51 remain outside this presentation redesign. There is no backend, persistence, analytics, account connection or runtime network call.

## Tokens and typography

Semantic CSS tokens: background #f4f8f8, foreground/brand navy #102d3b, white surface, primary/brand teal #007d87, primary hover #006771, secondary #e8f3f4, secondary foreground #125461, muted #edf2f4, muted foreground #506471, accent #deeff0, border #d4e0e5 and input border #bccdd5. High/destructive is #c73338, medium #9b6500 and low #177452; their pale surfaces are #fff0ef, #fff5df and #eaf6ef.

Locally bundled Manrope Variable supplies headings, legends and the loading wordmark. Source Sans 3 Variable supplies body and forms. Numerical fields and results use tabular numerals. Body is 16px with 1.55 line height. Base h1/h2/h3 sizes are 1.8rem/1.5rem/1.1rem; compact result and strategy headings override these to 1rem and .9rem. Supporting compact text is generally .75–.85rem.

Radius tokens are 10px control, 6px input and 14px panel. Actual component rules use 6px buttons, cards and most disclosures, and 8px main workspace/page panels. Do not assume every panel uses the panel token. Compact desktop concept icons use 36px containers, 28px glyphs and 10px corners; mobile input icons use 28px containers, 22px glyphs and 8px corners. Inline containers are 24px; empty-state icons remain larger. Hugeicons is the icon family; shadcn primitives provide controls, disclosures, tabs, tables and chart structure.

## States and accessibility

Startup HTML displays a centered Sonarora wordmark, “Protect bills first”, a thin travelling bar and “Loading…”, replaced when React is ready. Pending comparisons and purchase checks use the same quiet wordmark/bar/status language inside their panel; compact loading omits the tagline. The bar is indeterminate, not a numerical progress estimate. A zero-delay callback permits pending rendering without an artificial minimum wait.

Controls and navigation have 44px minimum targets. Focus uses a 3px teal outline with 3px offset; money inputs use a wrapper focus ring. Associated labels remain when visually hidden behind fieldset legends. A focusable error summary links to fields and opens relevant details. Status uses polite live regions and pending states identify busy content. Reduced-motion rules disable animation and transitions, including the startup bar. Chart text/table alternatives and pressed-state selection remain available. Print styles prioritize results and hide controls and inputs.

## Review status and limitations

Foundation commit 24654ad was approved. Newer interface changes are an uncommitted reviewable diff awaiting user approval; no push is authorized. Screen composition, copy, disclosures, comparison cards, purchase view and loading states are implemented; delivery is no longer foundation-only.

The inherited WebKit native-Tab failure appears in both baseline and final full checks. Do not claim the entire gate passed or accessibility certification. Source-level provisions and reported desktop fit do not replace browser and assistive-technology verification. The JSON sidecar is descriptive token documentation with source paths, not an assertion of compatibility with an unknown CLI schema. No Impeccable launcher was available; direct workflow guidance was used.

Money Map is available only on Compare options, following the user’s step-by-step review. It is absent from Your money.
