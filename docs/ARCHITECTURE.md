# Sonaroraaah implemented engine architecture — Sprint 2

Baseline: 9398777b76bd4c92fdb32b7a9357527db7573dfd on develop in the official Desktop checkout. The application UI remains unchanged and does not import the engine.

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
- state: previously implemented pure revision transitions; still no UI recalculation wiring.
- scenario/explanations: immutable data, code and display contracts.

## Public APIs and trust

compareScenario(draft) validates raw string fields and returns a structured success/failure. validateScenario creates a deeply frozen owned scenario registered in a module-local WeakSet. compareValidatedScenario and simulatePath reject objects that did not cross this boundary, even if a caller casts them to the branded type. The WeakSet is ephemeral runtime identity, not account storage or persistence. Serialized/cloned scenarios must be revalidated from a draft.

planSafeToBuy takes typed cent-denominated input and still validates it at runtime: registered scenario, every amount, supplier state, original bill identity/amount/status, partial/outstanding consistency, reported dates and confirmation provenance. It copies known fields into owned immutable data before calculation. Frontends must parse decimal supplier money with parseMoney; there is no UI adapter in this sprint.

Parse/distribution/comparison/simulation/planning input errors return structured codes, paths and message keys. Low-level checked arithmetic and output-day conversion throw on programmer misuse or bound violations; the public financial wrappers convert MoneyError into structured failures. There is no stale-result cache: callers use the separate revision transitions.

## Remaining proposals and limits

UI integration, cross-session worker routing, persistence, banking verification and any supplier verification remain unimplemented. Exact rational probability arithmetic is not the current policy: expected values deliberately retain R51 Number weighting and Math.round semantics, including documented binary half-cent behavior. A change to this policy or the historical wait-with-unpaid-bills rule requires explicit behavioral approval. No trained forecasting model or predictive accuracy claim exists.
