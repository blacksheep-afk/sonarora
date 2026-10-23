# Sonaroraaah

Operation 009. Sprint 0 is accepted. Sprint 1 defines architecture and typed contracts; Sprint 2 and deployment remain unapproved.

React + TypeScript + Vite foundation only. No financial engine, bank connection, storage or payments.

## Verification

Use Node 24 and the committed lockfile: `npm ci`, then `npm run gate:self-test` and `npm run check`.
Individual stages: `npm run lint`, `npm run typecheck`, `npm test`, `npm run reference:check`, `npm run build`.
The full gate fails closed if historical reference files are absent or altered.

## Branches

`main` is the intended protected release branch; `develop` is the integration branch. Local branch names do not establish GitHub protection. Require pull requests, a passing `quality` check, review, no force pushes and no deletions on main once permissions permit. No deployment workflow is included.

## Evidence

See `docs/SPRINT-0-REPORT.md` for actual checks, blockers and provenance. Original R51 files must be copied byte-for-byte and verified before committing. Transcript hashes and historical test counts are not new verification.

## Sprint 1

Engine contracts live under src/engine. Only pure revision transitions are implemented; financial parsing, validation and calculations remain future work. The existing UI shell is unchanged.

See [Architecture](docs/ARCHITECTURE.md), [Financial contracts](docs/FINANCIAL-CONTRACTS.md), [State contracts](docs/STATE-CONTRACTS.md), [Reference cases](docs/REFERENCE-CASES.md) and [Sprint 1 report](docs/SPRINT-1-REPORT.md). The typecheck command verifies both application/tests and the engine without DOM or Node ambient types.
