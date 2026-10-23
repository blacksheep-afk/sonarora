import { describe, expect, it } from 'vitest';
import { compareScenario } from '../../src/engine/comparison/index';
import { simulatePath, simulationDay } from '../../src/engine/simulation/index';
import type { SimulationOutcome } from '../../src/engine/simulation/index';
import { buildDistribution } from '../../src/engine/probability/index';
import { draft, validated, unwrap } from './financial-fixtures';
function single(overrides: Parameters<typeof validated>[0] = {}, strategy: 'now' | 'wait' | 'trigger' = 'now'): SimulationOutcome {
  const scenario = validated(overrides);
  const distribution = unwrap(buildDistribution(scenario.probability, scenario.receipt.timing.kind === 'known'));
  return unwrap(simulatePath(scenario, strategy, distribution.outcomes[0]!));
}
const noUncertainty = { receipt: '0', sales: '0', relation: 'independent' };
describe('independently derived simulation and exposure answers', () => {
  it('buys at Day 0 and pays the exact 20-cent bill without phantom shortfall', () => {
    const result = single({ cash: '.30', bank: '0', receivable: '0', stockCost: '.10', bills: [{ id: 'bill-1', amount: '.20' }], probability: noUncertainty });
    expect(result.purchase.buyDay).toBe(0);
    expect(result.endBalance).toBe(0);
    expect(result.shortfall).toBe(0);
    expect(result.unpaidEssential).toBe(0);
  });
  it('keeps a one-cent unpaid liability visible', () => {
    const result = single({ cash: '.19', bank: '0', receivable: '0', stockCost: '0', bills: [{ id: 'bill-1', amount: '.20' }], probability: noUncertainty });
    expect(result.unpaidByBill['bill-1']).toBe(1);
    expect(result.netAfterUnpaid).toBe(-1);
  });
  it('processes a receipt before same-day bills, then emergency costs', () => {
    const result = single({ cash: '0', bank: '0', receivable: '.30', receiptTiming: { kind: 'known', day: '1' }, dueDay: '1',
      bills: [{ id: 'bill-1', amount: '.20' }], stockCost: '0', emergency: { amount: '.10', day: '1' },
      probability: { receipt: '1', sales: '0', relation: 'independent' } });
    expect(result.events.map(event => event.kind)).toEqual(['receipt-cleared', 'essential-payment', 'essential-payment', 'emergency-payment', 'horizon-closed']);
    expect(result.unpaidEssential).toBe(0); expect(result.unpaidEmergency).toBe(0);
  });
  it('assigns limited funds according to the chosen bill priority', () => {
    for (const priority of ['first', 'second'] as const) {
      const result = single({ cash: '100', bank: '0', receivable: '0', stockCost: '0', bills: [{ id: 'bill-1', amount: '100' }, { id: 'bill-2', amount: '100' }], billPriority: priority, probability: noUncertainty });
      expect(result.unpaidByBill[priority === 'first' ? 'bill-1' : 'bill-2']).toBe(0);
      expect(result.unpaidByBill[priority === 'first' ? 'bill-2' : 'bill-1']).toBe(10000);
    }
  });
  it('separates emergency unpaid exposure from essential shortfall risk', () => {
    const result = unwrap(compareScenario(draft({ cash: '0', bank: '0', receivable: '0', stockCost: '0', bills: [], emergency: { amount: '100', day: '1' }, probability: noUncertainty }))).strategies.now;
    expect(result.modelledShortfallRisk).toBe(0);
    expect(result.expectedUnpaid).toBe(10000);
    expect(result.expectedNetAfterUnpaid).toBe(-10000);
  });
  it('does not retry an unaffordable Day 0 purchase after income arrives', () => {
    const result = single({ cash: '200', bank: '0', bills: [], receivable: '300', stockCost: '250', probability: { receipt: '1', sales: '0', relation: 'independent' } });
    expect(result.purchase.bought).toBe(false);
    expect(result.endBalance).toBe(50000);
  });
  it('protects future bills before a receipt-triggered purchase', () => {
    const common = { cash: '200', bank: '0', stockCost: '100', bills: [{ id: 'bill-1', amount: '500' }], probability: { receipt: '1', sales: '0', relation: 'independent' } };
    expect(single({ ...common, receivable: '300' }, 'trigger').purchase.bought).toBe(false);
    expect(single({ ...common, receivable: '400' }, 'trigger').purchase.buyDay).toBe(1);
  });
  it('blocks trigger after a prior shortfall but preserves R51 wait behavior with unpaid bills', () => {
    const scenario = { cash: '0', bank: '0', receivable: '300', receiptTiming: { kind: 'known' as const, day: '3' }, dueDay: '2', bills: [{ id: 'bill-1', amount: '500' }], stockCost: '100', probability: { receipt: '1', sales: '0', relation: 'independent' } };
    expect(single(scenario, 'trigger').purchase.bought).toBe(false);
    const wait = single(scenario, 'wait');
    expect(wait.purchase.buyDay).toBe(3);
    expect(wait.unpaidEssential).toBe(50000);
    expect(wait.endBalance).toBe(20000);
    expect(wait.netAfterUnpaid).toBe(-30000);
  });
  it('covers Day 14, 15, 29 and 30 without expanding input-day limits', () => {
    const result = single({ cash: '100', bank: '0', receivable: '0', bills: [], dueDay: '14', stockCost: '100', grossSales: '200', salesLagDays: '14', probability: { receipt: '0', sales: '1', relation: 'independent' } }, 'wait');
    expect(result.purchase.buyDay).toBe(15);
    expect(result.purchase.salesReceivedDay).toBe(29);
    expect(result.events.at(-1)).toEqual({ kind: 'horizon-closed', day: 30, balance: 20000 });
    expect(result.closingDay).toBe(30);
    for (const day of [14, 15, 29, 30]) expect(simulationDay(day)).toBe(day);
    expect(() => simulationDay(31)).toThrow('INVALID_DAY');
  });
  it('never records sales without purchase or expected receipts as cleared opening funds', () => {
    const result = single({ cash: '0', bank: '0', stockCost: '100', grossSales: '1000', receiptTiming: { kind: 'unknown' }, probability: { receipt: '1', sales: '1', relation: 'linked' } });
    expect(result.openingBalance).toBe(0); expect(result.purchase.bought).toBe(false);
    expect(result.events.some(event => event.kind === 'sales-received' || event.kind === 'receipt-cleared')).toBe(false);
  });
  it('matches closed-form 50/50 expected values without a copied simulator oracle', () => {
    // Receipt branch: R30 - R20 = R10 cash, no debt. Failure: R10 pays half,
    // leaves R10 debt and no cash. Their equal mixture is R5 cash/R5 unpaid/net R0.
    const result = unwrap(compareScenario(draft({ cash: '10', bank: '0', receivable: '20', bills: [{ id: 'bill-1', amount: '20' }], stockCost: '0', probability: { receipt: '.5', sales: '0', relation: 'independent' } }))).strategies.now;
    expect(result.modelledShortfallRisk).toBe(50);
    expect(result.expectedShortfall).toBe(500);
    expect(result.expectedUnpaid).toBe(500);
    expect(result.expectedEndBalance).toBe(500);
    expect(result.expectedNetAfterUnpaid).toBe(0);
  });
  it('labels and freezes financial results as modelled, user reported and not advice', () => {
    const result = unwrap(compareScenario(draft()));
    expect(result.assessment).toBe('modelled-not-advice');
    expect(result.source).toBe('user-reported'); expect(result.independentlyVerified).toBe(false);
    expect(Object.isFrozen(result.strategies.now.outcomes[0]?.events)).toBe(true);
  });
});

it('does not use same-day sales to retroactively pay the earlier essential bill', () => {
  const result = single({ cash: '100', bank: '0', receivable: '0', bills: [{ id: 'bill-1', amount: '100' }], dueDay: '1', stockCost: '100', grossSales: '200', salesLagDays: '1', probability: { receipt: '0', sales: '1', relation: 'independent' } });
  expect(result.unpaidEssential).toBe(10000);
  expect(result.endBalance).toBe(20000);
  expect(result.events.findIndex(event => event.kind === 'essential-payment')).toBeLessThan(result.events.findIndex(event => event.kind === 'sales-received'));
});
it('protects future emergencies before a conditional purchase', () => {
  const common = { cash: '0', bank: '0', bills: [], stockCost: '100', emergency: { amount: '100', day: '2' }, probability: { receipt: '1', sales: '0', relation: 'independent' } };
  expect(single({ ...common, receivable: '150' }, 'trigger').purchase.bought).toBe(false);
  expect(single({ ...common, receivable: '200' }, 'trigger').purchase.buyDay).toBe(1);
});
it('blocks a receipt trigger after an unpaid emergency without labelling it essential risk', () => {
  const result = single({ cash: '0', bank: '0', receivable: '300', receiptTiming: { kind: 'known', day: '2' }, bills: [], stockCost: '100', emergency: { amount: '100', day: '1' }, probability: { receipt: '1', sales: '0', relation: 'independent' } }, 'trigger');
  expect(result.purchase.bought).toBe(false);
  expect(result.shortfall).toBe(0);
  expect(result.unpaidEmergency).toBe(10000);
});
