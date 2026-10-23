import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { foundation } from '../src/foundation';

describe('Sprint 0 scope', () => {
  it('keeps the restart incomplete and financial capabilities disabled', () => {
    expect(foundation.status).toBe('incomplete');
    expect(foundation.accountConnection).toBe(false);
    expect(foundation.persistence).toBe(false);
    expect(foundation.payments).toBe(false);
    expect(foundation.financialEngine).toBe(false);
  });
  it('renders an honest foundation status in the application', () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('Sprint 0 · Incomplete');
    expect(markup).toContain('have not been implemented');
  });
});
