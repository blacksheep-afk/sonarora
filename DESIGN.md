# Sonarora interface design

## Direction

Operate mode: a calm, light financial workspace following the user's five-screen mockup. The donut is the memorable element; large softly tinted Hugeicons identify concepts without competing with the numerical result. No tracked eyebrows, decorative gradients or scattered motion.

## Tokens

- Brand navy / foreground: #102D3B
- Brand teal / primary: #007D87
- Paper / background: #F4F8F8; white surface
- Risk high / destructive: #C73338
- Risk medium: #9B6500
- Risk low: #177452

Use CSS semantic variables, including --primary, --destructive, --risk-high, --risk-medium, --risk-low, --surface and --brand-navy. Strategy colour identifies the strategy and must always have an icon and text; it does not assert absolute risk bands. Actual percentages can tie or change order.

Locally bundled Manrope: wordmark, headings and large tabular numerals. Locally bundled Source Sans 3: forms and explanations. Input radius 6px; control radius 10px; panel radius 14px. Visible 3px focus rings; 44px minimum interactive targets. Respect reduced motion.

## Layout

```text
Desktop 1280px
Brand                         1 Your money — 2 Compare — 3 Purchase
Prototype disclaimer
Your money                    | Your result
Four input groups             | Selected strategy donut + legend
More details                  | Money Map / table
Compare / Clear                | Print

Mobile 360px
Brand + compact stepper
Disclaimer
Your money
Your result
Money Map
```

Separate compare and staged-purchase views retain the shared header. Compare cards stack on phones. Explanations and full metrics remain accessible through disclosure and table views. Input changes expose a clear compare-again state immediately.

## Review of the plan

Removed the old oversized introduction and tracked section eyebrows. Preserved all existing financial inputs and validation. Relative model days replace the mockup calendar because no base date exists. A selected-strategy donut replaces the mockup's single segmented ring: three strategy risks are independent estimates, not parts of a total. Lowest-modelled-risk wording must show ties and never imply a transaction recommendation. No forced loading delay and no illustrative percentages presented as calculated output.

## Delivery slices

1. Theme, local fonts, shadcn foundation and shared icon wrapper.
2. Input/result composition, valid probability presets and accessible result visualisations.
3. Compare and staged purchase views; responsive/accessibility verification.

Each slice is shown as an uncommitted diff for user approval before committing. Current slice: foundation only; the final screen composition is pending.
