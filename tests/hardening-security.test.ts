import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { inspectApplication } from '../scripts/application-policy';
describe('Sprint 4 security/privacy guard',()=>{
 it.each([
  "node.innerHTML=raw;", "node['outerHTML']=raw;", "node.insertAdjacentHTML('beforeend',raw);",
  "const x=<div dangerouslySetInnerHTML={{__html:raw}}/>;",
  "document.cookie='session=1';","setTimeout('doSomething()',10);",
  "const x=<iframe srcDoc={raw}/>;", "new EventSource('/events');",
  "globalThis['fetch']('/bank');","import axe from 'axe-core';"
 ])('rejects unapproved unsafe application capability: %s',text=>{
  expect(inspectApplication('App.tsx',text).length).toBeGreaterThan(0);
 });
 it('keeps axe development-only and production dependencies unchanged',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8')) as {dependencies:Record<string,string>;devDependencies:Record<string,string>};
  expect(pkg.dependencies).toEqual({react:'19.3.1','react-dom':'19.3.1',zod:'4.6.7'});
  expect(pkg.devDependencies['axe-core']).toBe('4.14.0');
  expect(pkg.dependencies['axe-core']).toBeUndefined();
 });
});
