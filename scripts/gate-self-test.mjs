import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sentinel = new URL('../tests/intentional-failure.test.ts', import.meta.url);
if (existsSync(sentinel)) throw new Error('Refusing to overwrite existing sentinel');
try {
  writeFileSync(sentinel, "import { it, expect } from 'vitest';\nit('SPRINT0_INTENTIONAL_FAILURE', () => expect(1).toBe(2));\n", { flag: 'wx' });
  const result = spawnSync(process.execPath, ['scripts/quality-gate.mjs'], { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  console.log(output);
  if (result.status !== 1 || !output.includes('SPRINT0_INTENTIONAL_FAILURE') ||
      !output.includes('Quality gate FAILED at test') || output.includes('Quality gate: reference') ||
      output.includes('Quality gate: build')) {
    throw new Error('Quality gate did not stop at the intentional test failure');
  }
  console.log('PASS: intentional failure stops the quality gate before reference/build');
} finally {
  unlinkSync(sentinel);
}
