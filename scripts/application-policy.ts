import ts from 'typescript';
export const APPLICATION_IMPORTS:Readonly<Record<string,readonly string[]>>={
 'App.tsx':['react','./foundation','./application/adapter','./application/session'],
 'foundation.ts':[],
 'main.tsx':['react','react-dom/client','./App','./style.css'],
 'application/adapter.ts':['../engine/money/index','../engine/validation/index','../engine/comparison/index','../engine/safe-to-buy/index','../engine/state/index','../engine/explanations/index','../engine/simulation/index'],
 'application/session.ts':['../engine/state/index','../engine/validation/index','./adapter'],
};
export function inspectApplication(file:string,text:string):readonly string[] {
 const errors:string[]=[],allowed=APPLICATION_IMPORTS[file];
 if(!allowed)return [file+': unregistered application module'];
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const forbidden=['fetch','XMLHttpRequest','WebSocket','localStorage','sessionStorage','indexedDB','sendBeacon','require','eval','Function'];
 if(file.startsWith('application/'))forbidden.push('window','document','navigator','process','Buffer');
 function dependency(value:string){if(!allowed?.includes(value))errors.push(file+': forbidden dependency '+value);}
 function visit(n:ts.Node){
  if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){if(n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier))dependency(n.moduleSpecifier.text);}
  if(ts.isImportEqualsDeclaration(n))errors.push(file+': import equals forbidden');
  if(ts.isImportTypeNode(n)&&ts.isLiteralTypeNode(n.argument)&&ts.isStringLiteral(n.argument.literal))dependency(n.argument.literal.text);
  if(ts.isIdentifier(n)&&forbidden.includes(n.text))errors.push(file+': forbidden capability '+n.text);
  if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword)errors.push(file+': dynamic import forbidden');
  ts.forEachChild(n,visit);
 }
 visit(ast);return errors;
}