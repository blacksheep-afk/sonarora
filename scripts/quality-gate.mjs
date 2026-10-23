import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const commands = [
  ['lint', 'node_modules/eslint/bin/eslint.js', '.', '--max-warnings', '0'],
  ['typecheck', 'node_modules/typescript/bin/tsc', '--noEmit'],
  ['engine-typecheck', 'node_modules/typescript/bin/tsc', '-p', 'tsconfig.engine.json', '--noEmit'],
  ['test', 'node_modules/vitest/vitest.mjs', 'run'],
  ['reference', 'scripts/reference-regressions.mjs'],
  ['architecture', 'scripts/check-architecture.mjs'],
  ['build', 'node_modules/vite/bin/vite.js', 'build'],
];
for (const [name, ...args] of commands) {
  console.log(`\nQuality gate: ${name}`);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.error(`Quality gate FAILED at ${name}`);
    process.exit(1);
  }
}
console.log('Quality gate PASSED');
