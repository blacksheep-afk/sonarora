import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const run=spawnSync(process.execPath,['scripts/quality-gate.mjs'],{
 encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true,
 env:{...process.env,SONARORAAAH_A11Y_NEGATIVE:'1'}});
const output=(run.stdout??'')+(run.stderr??'');
console.log(output);
assert.equal(run.status,1,'Accessibility defect must make the full gate fail');
assert(output.includes('axe-negative-control')&&output.includes('Accessibility violations'),
 'Failure must be from the injected unlabeled input, not missing tooling');
assert(output.includes('Quality gate FAILED at application-browser'));
assert(!output.includes('Quality gate: cross-browser'));
console.log('PASS: deliberate accessibility failure propagates child exit 1 through full quality gate.');
