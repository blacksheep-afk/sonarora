import path from 'node:path';
import ts from 'typescript';

export const ENGINE_DEPENDENCIES = {
  money: [],
  probability: [],
  state: [],
  scenario: ['money', 'probability'],
  explanations: ['money', 'probability'],
  validation: ['money', 'probability', 'scenario'],
  simulation: ['money', 'probability', 'scenario'],
  comparison: ['money', 'probability', 'scenario', 'simulation', 'explanations'],
  'safe-to-buy': ['money', 'scenario', 'state', 'explanations'],
} as const;
type ModuleName = keyof typeof ENGINE_DEPENDENCIES;
const forbidden = new Set([
  'window', 'document', 'navigator', 'fetch', 'XMLHttpRequest', 'WebSocket',
  'localStorage', 'sessionStorage', 'indexedDB', 'sendBeacon', 'require',
  'process', 'Buffer', 'globalThis', 'self', 'eval', 'Function',
]);
export function inspectEngine(sources: Readonly<Record<string, string>>): readonly string[] {
  const errors: string[] = [];
  for (const module of Object.keys(ENGINE_DEPENDENCIES)) {
    if (!(module + '/index.ts' in sources)) errors.push('Missing module: ' + module);
  }
  for (const [file, content] of Object.entries(sources)) {
    const module = file.split('/')[0] as ModuleName;
    if (!(module in ENGINE_DEPENDENCIES) || file !== module + '/index.ts') {
      errors.push('Unexpected engine source: ' + file);
      continue;
    }
    const allowed: readonly string[] = ENGINE_DEPENDENCIES[module];
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    function checkDependency(specifier: string, typeOnly: boolean) {
      if (!specifier.startsWith('.')) { errors.push(file + ': external dependency ' + specifier); return; }
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)).replace(/\.ts$/, '') + '.ts';
      const dependency = resolved.split('/')[0] ?? '';
      if (!(resolved in sources) || !allowed.includes(dependency) || resolved !== dependency + '/index.ts') {
        errors.push(file + ': forbidden dependency ' + specifier);
      }
      if (!typeOnly) errors.push(file + ': engine dependencies must be type-only');
    }
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        checkDependency(node.moduleSpecifier.text, node.importClause?.isTypeOnly === true);
      }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        checkDependency(node.moduleSpecifier.text, node.isTypeOnly);
      }
      if (ts.isImportTypeNode(node) || ts.isImportEqualsDeclaration(node)) errors.push(file + ': import indirection forbidden');
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) errors.push(file + ': dynamic import forbidden');
      if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && forbidden.has(node.text)) errors.push(file + ': platform/dynamic API forbidden: ' + node.text);
      if (module !== 'state' && (
        ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) ||
        ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isClassDeclaration(node)
      )) errors.push(file + ': financial runtime implementation is outside Sprint 1');
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return errors;
}
