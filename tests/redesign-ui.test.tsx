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
    act(()=>host.querySelector<HTMLButtonElement>('button[aria-label="Unlikely: 0.25 probability"]')!.click());
    expect(host.querySelector('.result-highlight')).toBeNull();
    expect(host.querySelector<HTMLInputElement>('#receiptProbability')?.value).toBe('0.25');
    expect(host.textContent).toContain('Inputs changed, compare again');
  });
});
