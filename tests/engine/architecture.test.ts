import { describe, expect, it } from 'vitest';
import { inspectEngine, ENGINE_DEPENDENCIES } from '../../scripts/architecture-policy.ts';

function sources(module: string, content: string): Record<string, string> {
  const fixture: Record<string, string> = {};
  for (const name of Object.keys(ENGINE_DEPENDENCIES)) fixture[name + '/index.ts'] = '';
  fixture[module + '/index.ts'] = content;
  return fixture;
}
describe('architecture dependency enforcement', () => {
  it('allows a declared type-only edge', () => {
    expect(inspectEngine(sources('scenario', "import type { Cents } from '../money/index';"))).toEqual([]);
  });
  it.each([
    ['React', "import type { ReactNode } from 'react';"],
    ['DOM', "export type Bad = typeof document;"],
    ['network', "export type Bad = typeof fetch;"],
    ['storage', "export type Bad = typeof localStorage;"],
    ['Node', "import type { Stats } from 'node:fs';"],
    ['global escape', "export type Bad = typeof globalThis;"],
    ['dynamic imports', "const bad = import('../scenario/index');"],
    ['import type escape', "type Bad = import('react').ReactNode;"],
    ['require escape', "import bad = require('react');"],
  ])('rejects %s in the engine', (_name, content) => {
    expect(inspectEngine(sources('state', content)).length).toBeGreaterThan(0);
  });
  it('rejects forbidden reverse dependencies', () => {
    expect(inspectEngine(sources('money', "import type { FinancialScenario } from '../scenario/index';"))).toContain('money/index.ts: forbidden dependency ../scenario/index');
  });
  it('rejects runtime dependencies even when the module edge is allowed', () => {
    expect(inspectEngine(sources('scenario', "import { MAX_INPUT_CENTS } from '../money/index';")).length).toBeGreaterThan(0);
  });
  it('permits authorised financial functions while rejecting runtime in declarative and unapproved modules', () => {
    expect(inspectEngine(sources('money', 'export const calculate = () => 100;'))).toEqual([]);
    expect(inspectEngine(sources('scenario', 'export const calculate = () => 100;')).length).toBeGreaterThan(0);
    expect(inspectEngine({ ...sources('state', ''), 'banking/index.ts': '' }).length).toBeGreaterThan(0);
  });
  it('requires every engine module and rejects re-export bypasses', () => {
    expect(inspectEngine({}).length).toBe(9);
    expect(inspectEngine(sources('money', "export type { FinancialScenario } from '../scenario/index';")).length).toBeGreaterThan(0);
  });
});

it('allows only authorised financial runtime edges', () => {
  expect(inspectEngine(sources('simulation', "import { checkedCents } from '../money/index';"))).toEqual([]);
  expect(inspectEngine(sources('probability', "import { validateScenario } from '../validation/index';")).length).toBeGreaterThan(0);
});
