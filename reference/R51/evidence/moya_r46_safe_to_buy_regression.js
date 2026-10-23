#!/usr/bin/env node
'use strict';
// MOYA Round 40: calculation guardrail adversarial harness.
// Usage: node moya_r40_attack_FIXED.js [path-to-R37-index.html]
// Without an argument, loads index.html in the same folder as this script.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const candidate = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'index.html');
if (!fs.existsSync(candidate)) {
  console.error('ERROR: Cannot find R37 HTML: ' + candidate);
  console.error('Place this script beside the supplied index.html, or run:');
  console.error('  node moya_r40_attack_FIXED.js "C:\\path\\to\\index.html"');
  process.exit(2);
}
let src;
try { src = fs.readFileSync(candidate, 'utf8'); }
catch (e) { console.error('ERROR reading HTML: ' + e.message); process.exit(2); }
const numericStart=src.indexOf('const MAX_MONEY_CENTS=');
const numericEnd=src.indexOf('function jointCases(c)',numericStart);
const begin=src.indexOf('function validOrderBatch(');
const finish=src.indexOf('function safeSettings()',begin);
if(numericStart<0||numericEnd<0||begin<0||finish<0)throw new Error('Could not locate the R44 numeric and Safe-to-Buy functions');
const context={money:n=>'R'+n,console,Math,Number,BigInt,Set,Object,Array,String,Error};
vm.createContext(context);
try{vm.runInContext(src.slice(numericStart,numericEnd)+src.slice(begin,finish)+'this.safeToBuyPlan=safeToBuyPlan;this.centsOf=centsOf;this.validate=validate;',context,{timeout:3000,filename:'R44-safe-to-buy.js'})}catch(e){console.error('ERROR loading R44 Safe-to-Buy engine: '+e.message);process.exit(2)}
const plan=context.safeToBuyPlan;
if(typeof plan!=='function'){console.error('ERROR: R44 engine did not load.');process.exit(2)}const c = {cash:400,bank:200,receivable:300,pPay:.4,payDay:1,dateKnown:true,obligation:500,obligation2:0,priority:'first',dueDay:2,stock:250,sales:400,pSales:.75,salesLag:2,relation:'independent',emergency:0,emergencyDay:2};
const s = {supplierAccepted:true,starterCost:100,minimumBatch:100,batchStep:50,reserveBuffer:0,firstDeliveryFee:0,secondDeliveryFee:0,starterSales:160,remainderSales:240,obligationStatus1:'unpaid',paidAmount1:0,obligationStatus2:'none',paidAmount2:0,liabilitiesConfirmed:true,receiptConfirmed:true,clearedAmount:300,clearedDay:1,balanceConfirmed:true,currentFunds:800,remainingBills:0,remainingEmergency:0};
let tested = 0;
const failures = [];
function test(name, predicate) {
  tested++;
  try { if (!predicate()) failures.push(name); }
  catch (e) { failures.push(name + ': ' + e.message); }
}
test('baseline qualifies', () => plan(c,s).secondUnlocked === true);
test('documented R10 million input limit converts to exact cents',()=>context.centsOf(10000000)===1000000000);
test('documented maximum remains usable when exact aggregate is in range',()=>plan({...c,cash:10000000,obligation:0},{...s,obligationStatus1:'none'}).status==='feasible');
test('one cent above documented maximum is blocked',()=>plan({...c,cash:10000000.01},s).status==='blocked');
const overflowAttempt={...c,cash:90071992547409.91,bank:.04,obligation:90071992547409.91,stock:.10};
const overflowOrder={...s,starterCost:.05,minimumBatch:.01,batchStep:.01,starterSales:1,remainderSales:1};
const exactUnreservedCents=BigInt('9007199254740991')+4n-BigInt('9007199254740991');
test('BigInt oracle confirms aggregate attack has only four cents free',()=>exactUnreservedCents===4n);
test('aggregate-overflow attack is rejected before a staged purchase can be feasible',()=>plan(overflowAttempt,overflowOrder).status==='blocked');
test('no receipt cannot unlock', () => !plan(c,{...s,receiptConfirmed:false}).secondUnlocked);test('unresolved original bill cannot unlock', () => !plan(c,{...s,obligationStatus1:'unresolved'}).secondUnlocked);
test('refreshed R649.99 snapshot never adds confirmed R300 receipt again',()=>!plan(c,{...s,currentFunds:649.99}).secondUnlocked);
test('refreshed R650 snapshot meets exact remaining R150 purchase threshold',()=>plan(c,{...s,currentFunds:650}).secondUnlocked);
test('R300 partial payment reserves remaining R200', () => !plan(c,{...s,obligationStatus1:'partial',paidAmount1:300,currentFunds:349.99}).secondUnlocked);
test('paid R500 bill unlock uses only refreshed R150 balance', () => plan(c,{...s,obligationStatus1:'paid',currentFunds:150}).secondUnlocked);
test('additional unresolved bill stays locked', () => !plan({...c,obligation2:100},{...s,obligationStatus2:'unresolved',currentFunds:1000}).secondUnlocked);
test('paid status invalidated mathematically when marked unpaid', () => !plan(c,{...s,obligationStatus1:'unpaid',currentFunds:150}).secondUnlocked);
test('no balance check cannot unlock', () => !plan(c,{...s,balanceConfirmed:false}).secondUnlocked);
test('reserve exact boundary qualifies', () => plan(c,{...s,currentFunds:650}).secondUnlocked === true);
test('reserve one-cent lower locks', () => !plan(c,{...s,currentFunds:649.99}).secondUnlocked);
test('unconfirmed supplier off', () => plan(c,{...s,supplierAccepted:false}).status === 'off');
test('nonfinite entered balance blocked', () => plan(c,{...s,currentFunds:Infinity}).status === 'blocked');
test('wrong supplier increment blocks', () => plan(c,{...s,batchStep:30}).status === 'blocked');
for (const k of ['cash','bank','receivable','obligation','obligation2','stock','sales','emergency']) test('fractional-cent c.'+k+' blocked', () => plan({...c,[k]:k==='receivable'?300.001:(c[k]+0.001)},s).status==='blocked');
for (const k of ['starterCost','minimumBatch','batchStep','reserveBuffer','firstDeliveryFee','secondDeliveryFee','starterSales','remainderSales','clearedAmount','currentFunds','remainingBills','remainingEmergency']) test('fractional-cent s.'+k+' blocked', () => plan(c,{...s,[k]:s[k]+0.001}).status==='blocked');
test('valid one-cent values accepted', () => plan(c,{...s,currentFunds:650.01}).secondUnlocked===true);
let seed = 42;
const rand = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 2500; i++) {
  const cs={...c,obligation:Math.floor(rand()*10)*100,obligation2:Math.floor(rand()*3)*100,emergency:Math.floor(rand()*4)*50,cash:Math.floor(rand()*15)*100,bank:Math.floor(rand()*10)*100};
  const ss={...s,currentFunds:Math.floor(rand()*2000),remainingBills:Math.floor(rand()*1800),remainingEmergency:Math.floor(rand()*700),reserveBuffer:Math.floor(rand()*5)*25,receiptConfirmed:rand()>.3,balanceConfirmed:rand()>.3};
  const out=plan(cs,ss);
  test('random guardrail '+i, () => out.status !== 'feasible' || (
    out.firstSpend <= out.safeNow + 1e-8 && out.firstBalance >= out.reserve - 1e-8 &&
    (!out.secondUnlocked || (ss.receiptConfirmed && ss.balanceConfirmed && ss.clearedAmount > 0 && ss.currentFunds >= cs.obligation + cs.obligation2 + ss.remainingBills + ss.remainingEmergency + ss.reserveBuffer + out.secondSpend - 1e-8))
  ));
}
const findings=[];
if (plan(c,{...s,currentFunds:650.001}).secondUnlocked) findings.push('Fractional-cent currentFunds 650.001 is accepted; money inputs need cents validation.');
if (plan(c,{...s,clearedAmount:0.001}).secondUnlocked) findings.push('Fractional-cent clearedAmount 0.001 is accepted as a positive receipt.');
if (plan(c,{...s,clearedDay:2}).secondUnlocked) findings.push('Receipt, bill status, current funds, and other expense confirmations remain user-reported; no bank verification is available.');
const hash = crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex');
console.log('MOYA R46 — Liability reconciliation and Safe-to-Buy regression');
console.log('HTML: ' + candidate);
console.log('SHA-256: ' + hash);
console.log('Checks: ' + tested + ' | Passed: ' + (tested - failures.length) + ' | Failed: ' + failures.length);
if (failures.length) console.log('Failures:\n' + failures.slice(0, 20).map(x=>' - '+x).join('\n'));
console.log('Known limitations (not counted as passing safety properties):');
findings.forEach(x=>console.log(' - ' + x));
console.log('Scope: R46 liability reconciliation using R44 bounded-cent arithmetic, checked arithmetic, and inherited adversarial cases. Does not verify FNB data, users, browser UI or financial outcomes.');
process.exitCode = failures.length ? 1 : 0;



