import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';
import { inspectEngine, ENGINE_DEPENDENCIES } from './architecture-policy.ts';

const root = new URL('../', import.meta.url);
assert.deepEqual(new Set(readdirSync(new URL('src/', root))), new Set(['App.tsx', 'foundation.ts', 'main.tsx', 'style.css', 'engine']));
const uiImports = new Map([
  ['App.tsx', new Set(['./foundation'])],
  ['foundation.ts', new Set()],
  ['main.tsx', new Set(['react', 'react-dom/client', './App', './style.css'])],
]);
for (const [file, allowed] of uiImports) {
  const source = ts.createSourceFile(file, readFileSync(new URL('src/' + file, root), 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const specifier = node.moduleSpecifier;
      if (specifier) assert(allowed.has(specifier.text), file + ': unexpected UI dependency');
    }
    if (ts.isIdentifier(node)) assert(!['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'sendBeacon', 'require'].includes(node.text), file + ': forbidden UI capability');
    if (ts.isCallExpression(node)) assert(node.expression.kind !== ts.SyntaxKind.ImportKeyword, file + ': dynamic import forbidden');
    ts.forEachChild(node, visit);
  }
  visit(source);
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
console.log('PASS architecture: ' + Object.keys(ENGINE_DEPENDENCIES).length + ' engine modules; allowlisted type/runtime dependencies; validated financial boundary; unchanged UI boundary.');
console.log('Scope: conservative static guard plus engine compilation without DOM/Node ambient types; not a complete security proof.');
