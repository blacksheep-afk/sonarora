import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { foundation } from '../src/foundation';
describe('Sprint 3 application scope',()=>{
 it('integrates the engine while keeping external financial capabilities disabled',()=>{expect(foundation.sprint).toBe(3);expect(foundation.financialEngine).toBe(true);expect(foundation.accountConnection).toBe(false);expect(foundation.persistence).toBe(false);expect(foundation.payments).toBe(false);});
 it('starts without invented financial data or a stale result',()=>{const html=renderToStaticMarkup(<App/>);expect(html).toContain('Sonarora');expect(html).toContain('A clearer view of your options');expect(html).toContain('The example is invented');expect(html).not.toContain('data-strategy=');});
});