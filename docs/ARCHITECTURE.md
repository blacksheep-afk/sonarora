# Sonaroraaah Sprint 1 architecture

Sprint 0 baseline: 14a7cab4799fc99d294e762514ace10ccb511126. Work is in the official Desktop checkout on develop. No UI, historical reference, backend or financial engine migration.

## Modules and allowed dependencies

All engine imports are type-only. Paths below are under src/engine; each module has index.ts. No root barrel permits bypassing the graph.

| Module | May depend on |
| --- | --- |
| money | none |
| probability | none |
| state | none |
| scenario | money, probability |
| explanations | money, probability |
| validation | money, probability, scenario |
| simulation | money, probability, scenario |
| comparison | money, probability, scenario, simulation, explanations |
| safe-to-buy | money, scenario, state, explanations |

This is a directed acyclic graph. Node tooling in scripts/architecture-policy.ts checks exact module paths, type-only imports and re-exports; rejects undeclared modules, external packages, Node/DOM/network/storage identifiers, dynamic imports and import-type bypasses. No financial runtime functions, calls or classes are permitted outside state. State alone implements revision transitions; other modules contain types and declarative constants. Negative fixtures exercise the policy.

The separate tsconfig.engine.json compiles engine sources with ES2023 only and no Node, browser or React ambient types. The application and tests retain their existing environment. This static policy is deliberately conservative and is not a security sandbox or proof against every possible JavaScript escape.

## Boundaries

The existing React shell does not import the engine and is unchanged. Engine modules do not render, store data, fetch information, connect to banks or make payments. Validation types describe future functions, not implemented validation. Simulation and comparison contain signatures and immutable output shapes only. No constructor can currently turn a raw number into trusted money/probability/day; test-only branded casts are explicitly synthetic.

Future flow, not implemented: raw draft -> validation result -> normalized scenario -> joint distribution -> simulation outcomes -> comparison -> structured explanations. Safe-to-Buy is a distinct snapshot/confirmation contract. State wraps any immutable result with an input revision. UI integration is deferred.

## Historical behavior and design choices

R51 uses integer cents, input days 1..14, a Day 30 simulation horizon, and two essential bills with a shared due day and explicit payment priority, and now/wait/trigger strategies. Linked receipt/sales outcomes use the minimum marginal probability, not an arbitrary correlation or configurable joint input. Unknown receipt timing excludes the receipt from modelled paths. Preserve these when migration is separately approved.

Brands, module boundaries, structured error/reason codes, immutable envelopes, explicit incomplete/locked/modelled-feasible states and revision reducers are new contract design choices. They are not retroactive descriptions of R51's JavaScript types or its exact UI status strings. Supplier nonacceptance maps to a blocked explanation at the new boundary; historical R51 internally uses off. The new representation does not change the preserved implementation.

Original reference launchers and reports are preserved even where they contain obsolete filenames. The new quality gate invokes the original Node scripts directly and checks exit codes, rather than relying on legacy interactive CMD launchers. CI remains a proposed local workflow until Chief pushes and verifies it remotely.
