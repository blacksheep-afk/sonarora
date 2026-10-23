# Sonaroraaah

Operation 009. Restarted Sprint 0 is **incomplete**. No Sprint 1 work or deployment is authorized.

React + TypeScript + Vite foundation only. No financial engine, bank connection, storage or payments.

## Verification

Use Node 24 and the committed lockfile: `npm ci`, then `npm run gate:self-test` and `npm run check`.
Individual stages: `npm run lint`, `npm run typecheck`, `npm test`, `npm run reference:check`, `npm run build`.
The full gate fails closed if historical reference files are absent or altered.

## Branches

`main` is the intended protected release branch; `develop` is the integration branch. Local branch names do not establish GitHub protection. Require pull requests, a passing `quality` check, review, no force pushes and no deletions on main once permissions permit. No deployment workflow is included.

## Evidence

See `docs/SPRINT-0-REPORT.md` for actual checks, blockers and provenance. Original R51 files must be copied byte-for-byte and verified before committing. Transcript hashes and historical test counts are not new verification.
