import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// Reuse only the original adapter bootstrap; do not edit it or duplicate its tests.
const adapter = new URL('../reference/R51/evidence/moya_r46_dom_regression.js', import.meta.url);
const source = readFileSync(adapter, 'utf8');
const marker = source.indexOf('context.showChecks();');
assert(marker > 0, 'Preserved adapter bootstrap boundary changed');
const { engine, elements } = vm.runInNewContext(source.slice(0, marker) + '\n({ engine: vm.runInContext("({ evaluate, run, safeToBuyPlan, jointCases, centsOf, addC, expectedCents, checkedCents, render })", context), elements });', {
  require: createRequire(adapter),
  __dirname: path.dirname(fileURLToPath(adapter)),
  process: { argv: ['node', 'reference-check', fileURLToPath(new URL('../reference/R51/index.html', import.meta.url))] },
  console,
}, { timeout: 10_000 });
const base = {
  cash: 400, bank: 200, receivable: 300, pPay: 0.6, payDay: 1, dateKnown: true,
  obligation: 500, obligation2: 0, priority: 'first', dueDay: 2, stock: 250,
  sales: 400, pSales: 0.75, salesLag: 2, relation: 'independent', emergency: 0, emergencyDay: 2,
};
let passed = 0;
function check(id, test) { test(); passed++; console.log('PASS ' + id); }
check('REF-T01 same-day receipt precedes essential payment', () => {
  assert.equal(engine.evaluate({ ...base, cash: 0, bank: 0, receivable: 100, pPay: 1, payDay: 1, obligation: 100, dueDay: 1, stock: 0, pSales: 0 }, 'now').expectedUnpaid, 0);
});
check('REF-T02 late receipt does not erase deadline shortfall', () => {
  assert.equal(engine.evaluate({ ...base, cash: 0, bank: 0, receivable: 100, pPay: 1, payDay: 2, obligation: 100, dueDay: 1, stock: 0, pSales: 0 }, 'now').expectedGap, 100);
});
check('REF-T03 unaffordable buy-now is not retried', () => {
  assert.equal(engine.evaluate({ ...base, cash: 200, bank: 0, receivable: 300, pPay: 1, obligation: 0, stock: 250, pSales: 0 }, 'now').buyChance, 0);
});
check('REF-M01 two exact-cent bills', () => {
  const outcome = engine.evaluate({ ...base, cash: 0.30, bank: 0, receivable: 0, pPay: 0, obligation: 0.10, obligation2: 0.20, stock: 0, pSales: 0 }, 'now');
  assert.equal(outcome.expectedUnpaid, 0);
  assert.equal(outcome.expectedEnd, 0);
});
check('REF-L01 independent joint weights', () => {
  const outcomes = engine.jointCases(base);
  for (const [paid, sold, expected] of [[true, true, 0.45], [true, false, 0.15], [false, true, 0.30], [false, false, 0.10]]) {
    assert(Math.abs(outcomes.find(value => value.paid === paid && value.sold === sold).p - expected) < 1e-12);
  }
});
check('REF-L02 linked minimum-marginal weights', () => {
  const outcomes = engine.jointCases({ ...base, relation: 'linked' });
  assert.equal(outcomes.find(value => value.paid && value.sold).p, 0.6);
  assert.equal(outcomes.find(value => !value.paid && !value.sold).p, 0.25);
  assert(!outcomes.some(value => value.paid && !value.sold));
});
check('REF-L03 unknown receipt date excludes receipt', () => {
  assert(engine.jointCases({ ...base, dateKnown: false, pPay: 1 }).every(value => !value.paid));
});
const supplier = {
  supplierAccepted: true, starterCost: 100, minimumBatch: 100, batchStep: 50, reserveBuffer: 0,
  firstDeliveryFee: 0, secondDeliveryFee: 0, starterSales: 160, remainderSales: 240,
  receiptConfirmed: true, clearedAmount: 300, clearedDay: 1, balanceConfirmed: true,
  obligationStatus1: 'partial', paidAmount1: 300, obligationStatus2: 'none', paidAmount2: 0,
  liabilitiesConfirmed: true, currentFunds: 350, remainingBills: 0, remainingEmergency: 0,
};
check('REF-P01 partial-payment exact and one-cent boundaries', () => {
  assert.equal(engine.safeToBuyPlan(base, supplier).secondUnlocked, true);
  assert.equal(engine.safeToBuyPlan(base, { ...supplier, currentFunds: 349.99 }).secondUnlocked, false);
});
check('REF-P02 unresolved bill remains locked', () => {
  assert.equal(engine.safeToBuyPlan(base, { ...supplier, obligationStatus1: 'unresolved', paidAmount1: 0, currentFunds: 1000 }).secondUnlocked, false);
});
check('REF-F01 fractional cents fail rather than round', () => {
  assert.equal(typeof engine.centsOf, 'function');
  assert.throws(() => engine.centsOf('0.001', 'amount'), /exactly to cents/);
});
check('REF-F02 one cent over individual limit fails', () => {
  assert.throws(() => engine.centsOf('10000000.01', 'amount'), /cannot exceed R10,000,000/);
});
check('REF-F03 aggregate overflow fails', () => {
  assert.equal(typeof engine.addC, 'function');
  assert.throws(() => engine.addC(100000000000, 1), /supported exact-calculation range/);
});
check('REF-S01 historical input event clears comparison immediately', () => {
  engine.render();
  assert.notEqual(elements.get('results').innerHTML, '');
  elements.get('controls').handlers.input();
  assert.equal(elements.get('results').innerHTML, '');
  assert.match(elements.get('flag').innerHTML, /Inputs changed.*Compare choices/i);
});
check('REF-T04 wait purchase Day 15 and sales Day 29 fit the Day 30 horizon', () => {
  const result = engine.evaluate({ ...base, cash: 100, bank: 0, receivable: 0, pPay: 0, obligation: 0, dueDay: 14, stock: 100, sales: 200, pSales: 1, salesLag: 14 }, 'wait');
  assert.equal(result.cases[0].buyDay, 15);
  assert.equal(result.expectedEnd, 200);
  assert(result.cases[0].events.some(event => event.includes('Day 29: stock sales received')));
});
check('REF-M02 bill priority changes which bill remains unpaid', () => {
  const scenario = { ...base, cash: 100, bank: 0, receivable: 0, pPay: 0, obligation: 100, obligation2: 100, stock: 0, pSales: 0 };
  assert.equal(engine.evaluate({ ...scenario, priority: 'first' }, 'now').expectedUnpaidPayment1, 0);
  assert.equal(engine.evaluate({ ...scenario, priority: 'second' }, 'now').expectedUnpaidPayment1, 100);
});
check('REF-E01 emergency-only unpaid does not become essential shortfall risk', () => {
  const result = engine.evaluate({ ...base, cash: 0, bank: 0, receivable: 0, pPay: 0, obligation: 0, stock: 0, emergency: 100, pSales: 0 }, 'now');
  assert.equal(result.risk, 0);
  assert.equal(result.expectedUnpaid, 100);
  assert.equal(result.expectedNet, -100);
});
console.log(passed + '/16 expanded reference cases passed against original R51; not against a migrated engine.');
