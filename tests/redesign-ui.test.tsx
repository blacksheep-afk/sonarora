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
  it('opens purchase checks in a modal and preserves entered values when closed',()=>{
    click('Use example');finish();
    act(()=>host.querySelector<HTMLAnchorElement>('a[href="#safe-to-buy"]')!.click());
    expect(host.querySelector('.staged-checkpoint')).toBeNull();
    click('I understand and want to continue');
    expect(host.querySelector('[role=dialog]')?.textContent).toContain('Check smaller purchases');
    expect(document.activeElement?.id).toBe('splitAcceptance');
    const batch=host.querySelector<HTMLInputElement>('#minimumBatch')!;
    act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(batch,'75');batch.dispatchEvent(new Event('input',{bubbles:true}));});
    click('Done');expect(host.querySelector('[role=dialog]')).toBeNull();
    click('I understand and want to continue');
    expect(host.querySelector<HTMLInputElement>('#minimumBatch')?.value).toBe('75');
  });

  it('starts validation with one actionable detail and keeps the other errors collapsed',()=>{
    click('Compare options');finish();
    const summary=host.querySelector<HTMLElement>('.error-summary')!;
    const rest=summary.querySelector<HTMLDetailsElement>('details')!;
    expect(summary.querySelector('h2')?.textContent).toBe('Let’s check a few details');
    expect(rest.open).toBe(false);
    expect(summary.querySelectorAll(':scope > p a')).toHaveLength(1);
    expect(rest.querySelectorAll('a').length).toBeGreaterThan(1);
    expect(summary.textContent).not.toContain('bills.0.amount');
    expect(document.activeElement?.id).toBe('cash');
    act(()=>{rest.open=true;rest.querySelector<HTMLAnchorElement>('a[href="#salesProbability"]')!.click();});
    expect(host.querySelector('[role=dialog]')).not.toBeNull();
    expect(document.activeElement?.id).toBe('salesProbability');
  });

  it('cannot restore example results or navigate after clearing a pending example',()=>{
    click('Use example');expect(visibleLoading()).toHaveLength(0);
    click('Clear all');finish();
    expect(host.querySelector<HTMLInputElement>('#cash')?.value).toBe('');
    expect(host.querySelector('.result-highlight')).toBeNull();
    expect(host.querySelector('.home-workspace')?.hasAttribute('hidden')).toBe(false);
    expect(visibleLoading()).toHaveLength(0);
  });
  it('does not show a loader or a changed-input message while a comparison is pending',()=>{
    click('Use example');finish();
    act(()=>{const cash=host.querySelector<HTMLInputElement>('#cash')!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(cash,'601');cash.dispatchEvent(new Event('input',{bubbles:true}));});
    click('Compare options');
    expect(visibleLoading()).toHaveLength(0);
    expect(host.querySelector('#comparison .empty-result')).toBeNull();
    finish();
    expect(host.querySelectorAll('#comparison [data-strategy]')).toHaveLength(3);
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

  it('completes home, comparison and purchase checks without a forced delay or loader',()=>{
    click('Use example');
    expect(visibleLoading()).toHaveLength(0);
    act(()=>vi.advanceTimersByTime(0));
    expect(host.querySelector('.result-highlight')).not.toBeNull();
    click('Compare options');
    expect(visibleLoading()).toHaveLength(0);
    act(()=>vi.advanceTimersByTime(0));
    expect(host.querySelectorAll('#comparison [data-strategy]')).toHaveLength(3);
    act(()=>host.querySelector<HTMLAnchorElement>('a[href="#safe-to-buy"]')!.click());
    click('I understand and want to continue');click('Check smaller purchases');
    expect(visibleLoading()).toHaveLength(0);
    act(()=>vi.advanceTimersByTime(0));
    expect(host.querySelector('[data-testid="safe-result"] h3')).not.toBeNull();
  });

});
