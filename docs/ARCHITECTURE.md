# Sonaroraaah application and engine architecture — Sprint 3

Sprint 3 baseline: 9ebeebb3a0458173cf42428da6040d6b9e40f967 on develop in the official Desktop checkout. The approved Sprint 2 engine remains byte-for-byte unchanged. React consumes a dedicated application adapter; it cannot import the engine directly.

## Dependency graph

All engine source remains within the nine index.ts modules. Types may use only the declared edges; values may use only the narrower runtime edges.

| Module | Type dependencies | Runtime dependencies |
| --- | --- | --- |
| money | none | none |
| probability | none | none |
| state | none | none |
| scenario | money, probability | none |
| explanations | money, probability | none |
| validation | money, probability, scenario | money, probability |
| simulation | money, probability, scenario, validation | money, probability, validation |
| comparison | money, probability, scenario, simulation, explanations, validation | money, probability, simulation, validation |
| safe-to-buy | money, scenario, state, explanations, validation | money, validation |

The graph is acyclic. Sprint 1's prohibition on all financial runtime code is replaced by explicit Sprint 2 runtime allowlists; it would otherwise prohibit this authorised mission. Runtime imports remain forbidden in declarative scenario/explanations modules, and financial modules cannot import upward or bypass the graph via barrels/dynamic imports. Architecture tests retain forbidden React, DOM, Node, storage, network, import-indirection and reverse-dependency cases, and add an authorised-runtime-edge test.

Engine-only TypeScript compilation still uses ES2023 and no DOM, React or Node ambient types. The engine has no external packages, filesystem, clock, network, storage, backend or payment capability. The conservative AST guard is not a complete security proof.

## Implemented boundaries

- money: strict decimal-text parsing with BigInt digits; bounded integer-cent numbers; checked arithmetic, expected-value boundaries and display conversions.
- probability: validated finite weights, independent or linked minimum-marginal distributions, unknown-date exclusion and R51 path filtering.
- validation: structured field errors, immutable snapshots, safe bounds and supported-scenario checks.
- simulation: chronological 30-day cent paths, three strategies, explicit liabilities and typed event records.
- comparison: three strategy results, expected cents, essential risk, purchase/sales percentages, timing and domain reason codes.
- safe-to-buy: supplier constraints, reconciliation, starter affordability, refreshed reserves and revision-current attestations.
- state: pure revision transitions now called by the application session layer.
- scenario/explanations: immutable data, code and display contracts.

## Public APIs and trust

compareScenario(draft) validates raw string fields and returns a structured success/failure. validateScenario creates a deeply frozen owned scenario registered in a module-local WeakSet. compareValidatedScenario and simulatePath reject objects that did not cross this boundary, even if a caller casts them to the branded type. The WeakSet is ephemeral runtime identity, not account storage or persistence. Serialized/cloned scenarios must be revalidated from a draft.

planSafeToBuy takes typed cent-denominated input and still validates it at runtime: registered scenario, every amount, supplier state, original bill identity/amount/status, partial/outstanding consistency, reported dates and confirmation provenance. It copies known fields into owned immutable data before calculation. The application adapter parses decimal supplier money with parseMoney before planning.

Parse/distribution/comparison/simulation/planning input errors return structured codes, paths and message keys. Low-level checked arithmetic and output-day conversion throw on programmer misuse or bound violations; the public financial wrappers convert MoneyError into structured failures. There is no stale-result cache: callers use the separate revision transitions.

## Remaining proposals and limits

UI integration and session routing are implemented in Sprint 3. Worker-based execution, persistence, banking verification and supplier verification remain unimplemented. Exact rational probability arithmetic is not the current policy: expected values deliberately retain R51 Number weighting and Math.round semantics, including documented binary half-cent behavior. A change to this policy or the historical wait-with-unpaid-bills rule requires explicit behavioral approval. No trained forecasting model or predictive accuracy claim exists.

## Sprint 3 application integration

Data flow: React raw text drafts -> application/adapter.compareDraft -> validateScenario -> compareValidatedScenario -> immutable Snapshot -> session routing -> React display. Safe drafts use parseMoney and reportedReceiptDay, cross the same scenario validator, then call planSafeToBuy. The adapter supplies user-reported provenance, translates codes and formats engine cents; React contains no financial calculations. No new financial policy or calculation module was introduced.

application/session wraps the approved revision transitions. Every financial edit (including supplier, liability, reported receipt and balance fields) synchronously drops comparisons, Safe-to-Buy plans, pending requests and all confirmations. Each session has an ephemeral Symbol identity. Requests carry session, revision, kind and unique request identity. Completion requires all of them to match. Confirmation events carry their captured session/revision; edits from discarded sessions are rejected. Reset allocates a fresh identity even at revision zero. The timer is a UI loading boundary, not a worker, server call or automatic recalculation. Recalculation requires an explicit button.

The application AST policy allowlists every source module and dependency, including import-type expressions and re-exports. App can use React and the application modules; the adapter may consume only the approved engine APIs, never React/DOM/network/storage. The engine DAG and ES2023-only type check are retained. Static allowlists are conservative guardrails, not a complete sandbox or proof against hostile code.

Persistence, independent bank/supplier verification, payments, backend services and predictive ML remain absent. Local CI configuration now installs the pinned Python Playwright dependency and Chromium before the mandatory built-application browser gate; this workflow has not been run on GitHub or pushed.

## Reviewed visual specification

Reviewed App.tsx, foundation.ts, style.css, index.html and repository architecture/behavior reports before UI changes. No separate branding/design specification or AGENTS.md exists in the inspected checkout/ancestors. Preserve the existing system-ui font, #10251f background, #eaf5ef text and #b8dfcb accent. The responsive grid, form fieldsets, native details disclosure, semantic timeline and focus styles are new Sprint 3 integration choices using that palette; no new brand palette or font is introduced. Illustrative data is explicitly labelled invented. No strategy is automatically selected as a recommendation.

## Sprint 4 hardening (uncommitted, exit gate blocked)

The financial engine and nine-module DAG remain unchanged. Application capability checks additionally reject unsafe HTML sinks, cookie/global capability access, known computed sink accesses and string-code timers. Approved axe-core 4.14.0 is a pinned development dependency injected only by browser tests, never an application import. The gate retains all original tests and adds per-state axe/resilience checks, the separate unchanged historical browser suite and Firefox/WebKit execution. Missing tooling or failed assertions return nonzero. Browser evidence is reset to running on each attempt so stale passing results cannot mask a failure. A deliberately unlabeled test input verifies accessibility-failure propagation. WebKit currently fails plain-Tab workflow navigation; Chief instructed that the proposed tabindex zero fix remain unapplied. The gate therefore fails at cross-browser and no Sprint 4 commit/release readiness is claimed.
