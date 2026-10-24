import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import App from '../src/App';
import * as adapter from '../src/application/adapter';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);act(()=>root.render(<App/>));
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
function button(name:string):HTMLButtonElement {
 const node=[...host.querySelectorAll('button')].find(b=>b.textContent===name);
 if(!node)throw new Error('Missing button '+name);return node;
}
async function click(name:string) {
 await act(async()=>{button(name).click();await new Promise(r=>setTimeout(r,20));});
}
function select(id:string,value:string) {
 const node=host.querySelector<HTMLSelectElement>('#'+id)!;
 act(()=>{node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));});
}
function input(id:string,value:string) {
 const node=host.querySelector<HTMLInputElement>('#'+id)!;
 act(()=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(node,value);
  node.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
describe('Sprint 4 UI hardening',()=>{
 it('makes wait and rounding limitations visible without opening assumptions',async()=>{
  await click('Load illustrative example');await click('Compare three strategies');
  expect(host.querySelector('[data-strategy=wait]')?.textContent).toContain('missed essential payment');
  expect([...host.querySelectorAll('p')].some(p=>p.textContent?.startsWith('R51 rounding limitation:')&&!p.closest('details'))).toBe(true);
 });
 it('keeps the displayed map branch selected when the distribution shrinks',async()=>{
  await click('Load illustrative example');await click('Compare three strategies');
  select('map-path','3');input('receiptProbability','1');input('salesProbability','1');
  await click('Compare three strategies');
  expect(host.querySelectorAll('#map-path option')).toHaveLength(1);
  expect(host.querySelector<HTMLSelectElement>('#map-path')?.value).toBe('0');
 });
 it('restores focus from a summary link into a collapsed invalid disclosure',async()=>{
  await click('Compare three strategies');
  const field=host.querySelector<HTMLInputElement>('#salesProbability')!;
  const details=field.closest('details')!;details.open=false;
  act(()=>host.querySelector<HTMLAnchorElement>('a[href="#salesProbability"]')!.click());
  expect(details.open).toBe(true);expect(document.activeElement).toBe(field);
 });
 it('focuses a global validation summary when no individual field matches',async()=>{
  vi.spyOn(adapter,'compareDraft').mockReturnValueOnce({ok:false,issues:[{code:'AGGREGATE_LIMIT',path:[],messageKey:'validation.AGGREGATE_LIMIT'}]});
  await click('Compare three strategies');
  expect(document.activeElement).toBe(host.querySelector('[role=alert]'));
  expect(host.textContent).toContain('R1 billion');
 });
 it('fails closed after an unexpected staged adapter failure and provides focus recovery',async()=>{
  await click('Load illustrative example');
  for(const checkbox of host.querySelectorAll<HTMLInputElement>('input[type=checkbox]'))act(()=>checkbox.click());
  await click('Check staged purchase');expect(host.textContent).toContain('Later batch: modelled feasible');
  vi.spyOn(adapter,'safeDraft').mockImplementationOnce(()=>{throw new Error('test-only staged failure');});
  await click('Check staged purchase');
  expect(host.textContent).not.toContain('Later batch: modelled feasible');
  expect(document.activeElement).toBe(host.querySelector('[role=alert]'));
  await click('Return to financial inputs');expect(document.activeElement?.id).toBe('cash');
 });
 it('resets map strategy preference together with a discarded decision session',async()=>{
  await click('Load illustrative example');await click('Compare three strategies');
  select('map-strategy','wait');await click('New decision session');
  await click('Load illustrative example');await click('Compare three strategies');
  expect(host.querySelector<HTMLSelectElement>('#map-strategy')?.value).toBe('now');
 });
 it('uses correct ranges in scenario-day and reported-receipt errors',()=>{
  expect(adapter.errorsFor([{code:'INVALID_DAY',path:['receiptTiming','day'],messageKey:'x'}]).receiptDay).toBe('Use a whole day from 1 to 14.');
  expect(adapter.errorsFor([{code:'INVALID_DAY',path:['receiptDayReported'],messageKey:'x'}]).receiptDayReported).toContain('0 or later');
 });
});
