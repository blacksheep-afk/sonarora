# Sonarora

Independent financial decision-support prototype for South African informal traders and people with irregular income. Users compare purchase timing against essential bills using reported cash, uncertain receipts and sales assumptions. No transaction is recommended, executed or independently verified.

The interface operates in memory. No persistence, backend, analytics, banking connections or runtime network calls. React renders application-adapter snapshots and structured errors; financial calculations stay in the engine. Every financial edit invalidates results and confirmations immediately.

Retain two essential bills with a shared relative due day (1–14), exact integer-cent inputs, supplier terms, probability assumptions, sales lag, emergency expenses and all current disclaimers. Preserve reference/R51 unchanged. Audience needs calm language, legible amounts, visible uncertainty and phone-friendly controls.

The user supplied the five-screen Sonarora mockup and authorised design decisions on conflicts. Use neutral lowest-modelled-risk wording, including ties. Show actual engine results, never mockup percentages as calculated values. Use relative days, never invent calendar dates or probability defaults. Use Hugeicons exclusively, shadcn primitives, local fonts and semantic theme variables.

Commits require the user's approval after a diff summary. Work on ui/redesign, based on develop. Push only after an explicit “push”.
