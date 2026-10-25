# Differences from the supplied mockup

These preserve product truth or implement the user’s later request for plain English and a compact task.

- **Actual numbers:** the unchanged example calculates 6.25%, 0%, 0% rather than the mockup’s illustrative 38%, 12%, 4%. The interface shows real engine output. Equal values are identified as ties.
- **Individual rings:** the selected strategy has its own risk ring. The three risks are not parts of a total, so they are not combined into one segmented ring. Table alternatives expose the same values.
- **Relative days:** the existing engine uses days 1–14 and two bills with one due day. The UI does not invent calendar dates or independently due bills.
- **Plain labels:** “Wait until after bill day” accurately names the historical wait rule, which can still buy when an earlier bill is unpaid. “Buy after payment arrives” replaces receipt jargon. A lowest-chance banner does not recommend a transaction.
- **Full inputs retained:** bank money, second bill, sales assumptions, emergency costs, supplier rules and current reports remain available. Additional independent receipts and unrestricted bill dates are not supported by the existing engine. Optional notes and item descriptions do not affect the calculation. Required extra numbers are not falsely labelled optional.
- **Compactness:** the latest user request supersedes earlier huge-icon sizing. Input and strategy icons are smaller, cards are compact, cash/bank/bill use an independent column, and optional metrics and assumptions open on request. Money Map is available only on Compare options. The default money page and three cards fit a 1280×900 desktop screen; phones retain readable scrolling layouts.
- **Loading:** the boot screen follows the centred wordmark, tagline and thin bar. Later checks reuse a smaller in-panel version so the entire application does not disappear. There are no fabricated percentages or artificial application delays.
- **Staged workflow:** the four-step overview is shown first. Continue reveals the real supplier, bill, balance and confirmation inputs. Confirmations remain user reports and never independently verify a bank balance.

All money parsing, engine calculations, revision/session invalidation and original validation messages are preserved. The inherited WebKit keyboard failure is documented in `UI-REDESIGN-VERIFICATION.md`.
