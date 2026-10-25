import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { APPLICATION_IMPORTS, inspectApplication } from './application-policy.ts';
import { inspectEngine, ENGINE_DEPENDENCIES } from './architecture-policy.ts';

const root = new URL('../', import.meta.url);
assert.deepEqual(new Set(readdirSync(new URL('src/', root))), new Set(['App.tsx', 'foundation.ts', 'main.tsx', 'style.css', 'engine', 'application', 'components', 'lib']));
assert.deepEqual(new Set(readdirSync(new URL('src/application/', root))),new Set(['adapter.ts','session.ts']));
// Every UI module remains registered: adding a directory cannot hide a new capability.
function applicationModules(directory, prefix = '') {
 return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const relative = prefix + entry.name;
  if (relative === 'engine') return [];
  if (entry.isDirectory()) return applicationModules(new URL(entry.name + '/', directory), relative + '/');
  return /\.tsx?$/.test(entry.name) ? [relative] : [];
 });
}
assert.deepEqual(new Set(applicationModules(new URL('src/', root))), new Set(Object.keys(APPLICATION_IMPORTS)));
for(const file of Object.keys(APPLICATION_IMPORTS)) {
 const errors=inspectApplication(file,readFileSync(new URL('src/'+file,root),'utf8'));
 assert.equal(errors.length,0,errors.join('\n'));
}
const sources = {};
function collect(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) collect(url, relative + '/');
    else sources[relative] = readFileSync(url, 'utf8');
  }
}
collect(new URL('src/engine/', root));
const errors = inspectEngine(sources);
assert.equal(errors.length, 0, errors.join('\n'));
const entry = readFileSync(new URL('index.html', root), 'utf8');
assert(entry.includes('<title>Sonaroraaah</title>') && !/MOYA/i.test(entry), 'Sonaroraaah branding required');
assert(readFileSync(new URL('src/foundation.ts', root), 'utf8').includes("product: 'Sonaroraaah'"));
console.log('PASS architecture: ' + Object.keys(ENGINE_DEPENDENCIES).length + ' engine modules; allowlisted type/runtime dependencies; validated financial boundary; React → application adapter → approved engine boundary.');
console.log('Scope: conservative static guard plus engine compilation without DOM/Node ambient types; not a complete security proof.');
