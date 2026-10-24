# Sonaroraaah controlled demonstration

Use the verified local Chromium-family or Firefox environment. WebKit currently fails keyboard navigation; this is a release blocker, not a passing browser. This is an invented example, never live customer data or a payment recommendation. No bank, supplier or FNB endorsement is implied.

## Preparation

From the official Desktop repository, build with npm run build, then use npm run dev -- --host 127.0.0.1 for a local demonstration. The automated browser suites use production preview of dist instead. This is local viewing, not deployment. Keep a fresh session and the limitations visible.

## Script (about 8 minutes)

1. **Enter assumptions.** Choose New decision session. Explain cleared cash is already reported available; an expected receipt is separate and uncertain. Enter the following invented inputs, or use Load illustrative example as a repeatable preflight and demonstrate editing cash from 600 to 601 and back to 600. Show the advanced fields before submission.

   | Input | Invented value |
   | --- | --- |
   | Cleared cash / bank | R600 / R0 |
   | Expected receipt / probability / timing | R300 / 0.75 / known Day 2 |
   | Essential bill 1 / bill 2 | R500 / R0 |
   | Shared due day / priority | Day 3 / bill 1 first |
   | Stock cost / gross sales / sales lag | R250 / R400 / 2 days |
   | Sales probability / relationship | 0.75 / independent |
   | Emergency amount / day | R0 / Day 3 |

2. **Compare three strategies.** Press Compare three strategies using the keyboard. Read the three names without choosing a winner. Explain essential risk excludes emergency-only debt; combined unpaid and net include it. End balance is cash, while net subtracts unpaid liabilities. Gross sales are not profit, probabilities are assumptions rather than predictions, and weighted values are not a guaranteed cash path.

3. **Explore Money Map.** Select Buy now and the branch in which neither receipt nor sales succeeds. The assumed branch weight is 6.25%. Starting R600 less the R250 purchase leaves R350 for a R500 bill: R150 remains unpaid, closing cash is R0 and net is -R150. Choose another branch to show that the receipt/sales are uncertain. Each timeline is an actual engine path; nothing is live or guaranteed.

4. **Investigate obligations and caveats.** Inspect per-bill unpaid amounts and the timeline. Read the visible wait-strategy warning: it can buy after an earlier bill was missed. Read the visible R51 half-cent limitation: a weighted 50 cents x 0.29 can display R0.14 instead of decimal half-up R0.15; expected metrics round separately. No financial policy was changed to make the demo look better.

5. **Check a staged purchase.** Open supplier/reconciliation/refreshed-report disclosures. All supplier acceptance and payment reports below are invented, unverified assumptions. Set these values (the illustrative loader already supplies them):

   | Input | Invented value |
   | --- | --- |
   | Split acceptance / minimum / increment | reported accepted / R50 / R50 |
   | First / later delivery fee | R0 / R0 |
   | Starter cost / estimated gross sales | R100 / R160 |
   | Later estimated gross sales / buffer | R240 / R0 |
   | Bill 1 reconciliation | partly paid, R300 paid, R200 outstanding |
   | Bill 2 | original amount explicitly R0; no liability |
   | Reported cleared receipt / day | R300 / Day 2 |
   | Refreshed cleared funds (receipt included) | R350 |
   | Remaining other bills / emergency | R0 / R0 |

   Check without confirmations: later batch stays Locked. Inspect the three reports, check the three user confirmations and check again. Starter/later states become modelled feasible under these assumptions. R350 refreshed funds minus R200 reserve leaves exactly R150 for the later order. The R300 receipt is not added again. Explain that feasible is a model constraint result, not a purchase instruction or independent verification.

6. **Invalidate old decisions.** Change refreshed funds to R349.99. Comparisons/staged output disappear and all confirmations clear immediately. Confirm the reports again and check: the later order stays Locked because it is one cent short. No old output reappears.

7. **Reset.** Choose New decision session. Show blank amounts, unchecked reports and no current financial output. Explain reload also loses this local session; the app has no persistence.

## Closing limitations

The example is invented. There are at most two essential bills with one shared due day, input days 1–14 and a Day 30 horizon. Unknown receipt dates exclude the receipt. Unentered taxes, interest and expenses are not invented. R51 rounding/wait behavior is retained. No bank connection, payment, analytics, forecasting model or independent supplier approval exists. No adoption, impact or testimonial claims are made.

The executable browser cases rehearse these interactions and independently expected cent boundaries. They do not certify every user journey, real-world financial accuracy, complete accessibility or release readiness. The WebKit keyboard blocker remains open by Chief's instruction; Sprint 4 acceptance and any release approval remain pending.
