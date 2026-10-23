import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const script of ['check-reference.mjs', '../reference/R51/evidence/moya_r46_safe_to_buy_regression.js', '../reference/R51/evidence/moya_r46_dom_regression.js']) {
  const args = script === 'check-reference.mjs'
    ? ['scripts/check-reference.mjs']
    : [fileURLToPath(new URL(script, import.meta.url)), 'reference/R51/index.html'];
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(1);
}
