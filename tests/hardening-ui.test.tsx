import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import App from '../src/App';
import * as adapter from '../src/application/adapter';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{
 history.replaceState({},'', '/');
 vi.useFakeTimers();
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 host=document.createElement('div');document.body.append(host);
 root=createRoot(host);act(()=>root.render(<App/>));
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();});
function button(name:string):HTMLButtonElement {
 const node=[...host.querySelectorAll('button')].find(b=>b.textContent===name);
 if(!node)throw new Error('Missing button '+name);return node;
}
async function click(name:string) {
 await act(async()=>{if(['Compare options','Clear all'].includes(name) && host.querySelector('[role=dialog]'))button('Done').click();button(name).click();await vi.advanceTimersByTimeAsync(5000);});
}
function select(id:string,value:string) {
 const node=host.querySelector<HTMLSelectElement>('#'+id)!;
 act(()=>{node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));});
}
function input(id:string,value:string) {
 if(!host.querySelector('#'+id))act(()=>button('More details').click());
 const node=host.querySelector<HTMLInputElement|HTMLSelectElement>('#'+id)!;
 act(()=>{
  Object.getOwnPropertyDescriptor(node instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value')!.set!.call(node,value);
  node.dispatchEvent(new Event(node instanceof HTMLSelectElement?'change':'input',{bubbles:true}));
 });
}
describe('Sprint 4 UI hardening',()=>{
 it('makes wait and rounding limitations visible without opening assumptions',async()=>{
  await click('Use example');await click('Compare options');
  expect(host.querySelector('[data-strategy=wait]')?.textContent).toContain('bill could still be unpaid');
  expect([...host.querySelectorAll('p')].some(p=>p.textContent?.startsWith('Amounts are estimates.')&&!p.closest('details'))).toBe(true);
  expect(host.querySelector('.rounding-details')?.textContent).toContain('R51 rounding limitation:');
 });
 it('keeps the displayed map branch selected when the distribution shrinks',async()=>{
  await click('Use example');await click('Compare options');
  select('map-path','3');input('receiptProbability','1');input('salesProbability','1');
  await click('Compare options');
  expect(host.querySelectorAll('#map-path option')).toHaveLength(1);
  expect(host.querySelector<HTMLSelectElement>('#map-path')?.value).toBe('0');
 });
 it('opens the details modal and focuses the invalid field from an error link',async()=>{
  await click('Compare options');
  expect(host.querySelector('[role=dialog]')).toBeNull();
  act(()=>host.querySelector<HTMLAnchorElement>('a[href="#salesProbability"]')!.click());
  expect(host.querySelector('[role=dialog]')).not.toBeNull();
  expect(document.activeElement?.id).toBe('salesProbability');
 });
 it('focuses a global validation summary when no individual field matches',async()=>{
  vi.spyOn(adapter,'compareDraft').mockReturnValueOnce({ok:false,issues:[{code:'AGGREGATE_LIMIT',path:[],messageKey:'validation.AGGREGATE_LIMIT'}]});
  await click('Compare options');
  expect(document.activeElement).toBe(host.querySelector('[role=alert]'));
  expect(host.textContent).toContain('R1 billion');
 });
 it('fails closed after an unexpected staged adapter failure and provides focus recovery',async()=>{
  await click('Use example');await click('I understand and want to continue');
  for(const checkbox of host.querySelectorAll<HTMLInputElement>('input[type=checkbox]'))act(()=>checkbox.click());
  await click('Check smaller purchases');expect(host.textContent).toContain('Next purchase: fits these numbers');
  vi.spyOn(adapter,'safeDraft').mockImplementationOnce(()=>{throw new Error('test-only staged failure');});
  await click('Check smaller purchases');
  expect(host.textContent).not.toContain('Next purchase: fits these numbers');
  expect(document.activeElement).toBe(host.querySelector('[role=alert]'));
  await click('Review your inputs');expect(document.activeElement?.id).toBe('cash');
 });
 it('resets map strategy preference together with a discarded decision session',async()=>{
  await click('Use example');await click('Compare options');
  select('map-strategy','wait');await click('Clear all');
  await click('Use example');await click('Compare options');
  expect(host.querySelector<HTMLSelectElement>('#map-strategy')?.value).toBe('now');
 });
 it('uses correct ranges in scenario-day and reported-receipt errors',()=>{
  expect(adapter.errorsFor([{code:'INVALID_DAY',path:['receiptTiming','day'],messageKey:'x'}]).receiptDay).toBe('Use a whole day from 1 to 14.');
  expect(adapter.errorsFor([{code:'INVALID_DAY',path:['receiptDayReported'],messageKey:'x'}]).receiptDayReported).toContain('0 or later');
 });
});
