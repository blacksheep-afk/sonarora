import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import App from '../src/App';
let host: HTMLDivElement, root: Root;
function button(name: string): HTMLButtonElement {
  const node=[...host.querySelectorAll('button')].find(button=>button.textContent===name);
  if(!node)throw new Error('Missing action '+name);
  return node;
}
beforeEach(()=>{
  history.replaceState({},'', '/');
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  vi.useFakeTimers();
  host=document.createElement('div');document.body.append(host);
  root=createRoot(host);act(()=>root.render(<App />));
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();});
function click(name: string) {act(()=>button(name).click());}
function finish() {act(()=>vi.runAllTimers());}
function visibleLoading() {return [...host.querySelectorAll<HTMLElement>('.loading-state')].filter(node=>!node.closest('[hidden]'));}
describe('redesigned decision flow',()=>{
  it('cannot restore example results or navigate after clearing a pending example',()=>{
    click('Use example');expect(visibleLoading()).toHaveLength(1);
    click('Clear all');finish();
    expect(host.querySelector<HTMLInputElement>('#cash')?.value).toBe('');
    expect(host.querySelector('.result-highlight')).toBeNull();
    expect(host.querySelector('.home-workspace')?.hasAttribute('hidden')).toBe(false);
    expect(visibleLoading()).toHaveLength(0);
  });
  it('uses the same in-panel loading language for comparison and staged checks without hiding the workspace',()=>{
    click('Use example');
    const comparison=visibleLoading()[0];expect(comparison?.textContent).toBe('SonaroraLoading…');
    expect(comparison?.getAttribute('aria-busy')).toBe('true');
    expect(host.querySelector('.home-workspace')?.hasAttribute('hidden')).toBe(false);
    finish();
    act(()=>host.querySelector<HTMLAnchorElement>('a[href="#safe-to-buy"]')!.click());
    click('I understand and want to continue');click('Check smaller purchases');
    expect(visibleLoading()).toHaveLength(1);
    expect(visibleLoading()[0]?.textContent).toBe(comparison?.textContent);
    expect(visibleLoading()[0]?.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Loading Sonarora');
    finish();expect(visibleLoading()).toHaveLength(0);
  });
  it('invalidates the current result immediately when a probability preset changes',()=>{
    click('Use example');finish();expect(host.querySelector('.result-highlight')).not.toBeNull();
    act(()=>{const select=host.querySelector<HTMLSelectElement>('#receiptProbability')!;select.value='0.25';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelector('.result-highlight')).toBeNull();
    expect(host.querySelector<HTMLInputElement>('#receiptProbability')?.value).toBe('0.25');
    expect(host.textContent).toContain('Inputs changed, compare again');
  });
  it('keeps modal edits when closed and invalidates the old result immediately',()=>{
    click('Use example');finish();click('More details');
    const bill=host.querySelector<HTMLInputElement>('#bill2')!;
    act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(bill,'100');bill.dispatchEvent(new Event('input',{bubbles:true}));});
    expect(host.querySelector('.result-highlight')).toBeNull();
    click('Done');expect(host.querySelector('[role=dialog]')).toBeNull();
    click('More details');expect(host.querySelector<HTMLInputElement>('#bill2')?.value).toBe('100');
  });
  it('opens the modal and focuses the first invalid extra field on submit',()=>{
    click('Use example');finish();click('More details');
    const bill=host.querySelector<HTMLInputElement>('#bill2')!;
    act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(bill,'');bill.dispatchEvent(new Event('input',{bubbles:true}));});
    click('Done');click('Compare options');finish();
    expect(host.querySelector('[role=dialog]')).not.toBeNull();
    expect(document.activeElement?.id).toBe('bill2');
    expect(host.querySelector('#bill2')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps every calculation loading for at least five seconds',()=>{
    click('Use example');
    act(()=>vi.advanceTimersByTime(4999));
    expect(visibleLoading()).toHaveLength(1);
    expect(host.querySelector('.result-highlight')).toBeNull();
    act(()=>vi.advanceTimersByTime(1));
    expect(visibleLoading()).toHaveLength(0);
    expect(host.querySelector('.result-highlight')).not.toBeNull();
    click('Compare options');
    act(()=>vi.advanceTimersByTime(4999));expect(visibleLoading()).toHaveLength(1);
    act(()=>vi.advanceTimersByTime(1));expect(visibleLoading()).toHaveLength(0);
    act(()=>host.querySelector<HTMLAnchorElement>('a[href="#safe-to-buy"]')!.click());
    click('I understand and want to continue');click('Check smaller purchases');
    act(()=>vi.advanceTimersByTime(4999));expect(visibleLoading()).toHaveLength(1);
    act(()=>vi.advanceTimersByTime(1));expect(visibleLoading()).toHaveLength(0);
  });

});
