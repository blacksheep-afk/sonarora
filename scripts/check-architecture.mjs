import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const expected = new Set(['App.tsx', 'foundation.ts', 'main.tsx', 'style.css']);
const files = readdirSync(new URL('src/', root));
assert.deepEqual(new Set(files), expected, 'Sprint 0 source boundary changed; review before adding engine/backend modules');
const imports = new Map([
  ['App.tsx', new Set(['./foundation'])],
  ['foundation.ts', new Set()],
  ['main.tsx', new Set(['react', 'react-dom/client', './App', './style.css'])],
]);
for (const [file, allowed] of imports) {
  const source = ts.createSourceFile(file, readFileSync(new URL(`src/${file}`, root), 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const specifier = node.moduleSpecifier;
      if (specifier) assert(allowed.has(specifier.text), `${file}: forbidden dependency ${specifier.text}`);
    }
    if (ts.isIdentifier(node)) {
      assert(!['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'sendBeacon', 'require'].includes(node.text), `${file}: network, persistence or dynamic dependency capability forbidden in Sprint 0`);
    }
    if (ts.isCallExpression(node)) {
      assert(node.expression.kind !== ts.SyntaxKind.ImportKeyword, `${file}: dynamic imports forbidden`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const entry = readFileSync(new URL('index.html', root), 'utf8');
assert(entry.includes('<title>Sonaroraaah</title>'), 'Application title must be Sonaroraaah');
assert(!/MOYA/i.test(entry), 'Historical branding leaked into application entry');
const metadata = readFileSync(new URL('src/foundation.ts', root), 'utf8');
assert(metadata.includes("product: 'Sonaroraaah'"), 'Application name mismatch');
console.log('PASS architecture: foundation-only modules, allowed static imports, no direct network/storage APIs, Sonaroraaah branding');
console.log('Scope: static source guard; not a comprehensive security audit.');
