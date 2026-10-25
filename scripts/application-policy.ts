import ts from 'typescript';
export const APPLICATION_IMPORTS:Readonly<Record<string,readonly string[]>>={
 'App.tsx':['react','./foundation','./application/adapter','./application/session','./components/ui/button','./components/ui/input','./components/ui/label','./components/AppIcon','@hugeicons/core-free-icons'],
 'lib/utils.ts':['clsx', 'tailwind-merge'],
 'components/AppIcon.tsx':['@hugeicons/react', 'class-variance-authority', '@/lib/utils'],
 'components/ui/card.tsx':['react', '@/lib/utils'],
 'components/ui/progress.tsx':['react', '@/lib/utils', 'radix-ui'],
 'components/ui/label.tsx':['react', '@/lib/utils', 'radix-ui'],
 'components/ui/alert.tsx':['react', 'class-variance-authority', '@/lib/utils'],
 'components/ui/badge.tsx':['react', 'class-variance-authority', '@/lib/utils', 'radix-ui'],
 'components/ui/separator.tsx':['react', '@/lib/utils', 'radix-ui'],
 'components/ui/button.tsx':['react', 'class-variance-authority', '@/lib/utils', 'radix-ui'],
 'components/ui/input.tsx':['react', '@/lib/utils'],
 'components/ui/skeleton.tsx':['@/lib/utils'],
 'foundation.ts':[],
 'main.tsx':['react','react-dom/client','./App','./style.css','@fontsource-variable/manrope/index.css','@fontsource-variable/source-sans-3/index.css'],
 'application/adapter.ts':['../engine/money/index','../engine/validation/index','../engine/comparison/index','../engine/safe-to-buy/index','../engine/state/index','../engine/explanations/index','../engine/simulation/index'],
 'application/session.ts':['../engine/state/index','../engine/validation/index','./adapter'],
};
export function inspectApplication(file:string,text:string):readonly string[] {
 const errors:string[]=[],allowed=APPLICATION_IMPORTS[file];
 if(!allowed)return [file+': unregistered application module'];
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const forbidden=['fetch','XMLHttpRequest','WebSocket','localStorage','sessionStorage','indexedDB','sendBeacon','require','eval','Function','innerHTML','outerHTML','insertAdjacentHTML','dangerouslySetInnerHTML','srcDoc','cookie','globalThis','self','EventSource'];
 if(file.startsWith('application/'))forbidden.push('window','document','navigator','process','Buffer');
 function dependency(value:string){if(!allowed?.includes(value))errors.push(file+': forbidden dependency '+value);}
 function visit(n:ts.Node){
  if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){if(n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier))dependency(n.moduleSpecifier.text);}
  if(ts.isImportEqualsDeclaration(n))errors.push(file+': import equals forbidden');
  if(ts.isImportTypeNode(n)&&ts.isLiteralTypeNode(n.argument)&&ts.isStringLiteral(n.argument.literal))dependency(n.argument.literal.text);
  if(ts.isElementAccessExpression(n) && n.argumentExpression && (ts.isStringLiteral(n.argumentExpression)||ts.isNoSubstitutionTemplateLiteral(n.argumentExpression)) && forbidden.includes(n.argumentExpression.text)) errors.push(file+': forbidden computed capability '+n.argumentExpression.text);
  if(ts.isIdentifier(n)&&forbidden.includes(n.text))errors.push(file+': forbidden capability '+n.text);
  if(ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ['setTimeout','setInterval'].includes(n.expression.text) && n.arguments[0] && (ts.isStringLiteral(n.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(n.arguments[0]))) errors.push(file+': string code timer forbidden');
  if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword)errors.push(file+': dynamic import forbidden');
  ts.forEachChild(n,visit);
 }
 visit(ast);return errors;
}