'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'index.html');
const html=fs.readFileSync(file,'utf8');
const script=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
if(!script) throw new Error('Inline application script was not found');
class Element {
  constructor(id, value='', checked=false){this.id=id;this.value=value;this.checked=checked;this.disabled=false;this.innerHTML='';this.textContent='';this.dataset={};this.handlers={};}
  addEventListener(name,fn){this.handlers[name]=fn;}
  click(){this.handlers.click?.({target:this});}
}
const elements=new Map();
const defaults=new Map();
for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){
  const attrs=m[2], id=(attrs.match(/\bid="([^"]+)"/)||[])[1];
  if(!id) continue;
  const tag=m[1].toLowerCase(),type=(attrs.match(/\btype="([^"]+)"/)||[])[1]||'';
  const value=(attrs.match(/\bvalue="([^"]*)"/)||[])[1]||'';
  const checked=/\bchecked(?:\s|>|$)/.test(attrs);
  let selected=value;
  if(tag==='select'){
    const tail=html.slice(m.index,html.indexOf('</select>',m.index));
    const opts=[...tail.matchAll(/<option\b([^>]*)>/g)];const chosen=opts.find(o=>/\bselected(?:\s|$)/.test(o[1]))||opts[0];selected=chosen?((chosen[1].match(/\bvalue="([^"]*)"/)||[])[1]||''):'';
  }
  elements.set(id,new Element(id,selected,tag==='input'&&type==='checkbox'&&checked));
  if(tag==='input'||tag==='select') defaults.set(id,{value:selected,checked:tag==='input'&&type==='checkbox'&&checked});
}
const document={getElementById:id=>elements.get(id)||null};
const HTMLFormElement={prototype:{reset(){for(const [id,def] of defaults){const el=elements.get(id);el.value=def.value;el.checked=def.checked;}}}};
const context=vm.createContext({document,HTMLFormElement,console,Math,Number,Date,Set,Object,Array,String,Error,JSON});
vm.runInContext(script,context,{timeout:5000,filename:'R44-inline-app.js'});
context.showChecks();
const inherited=elements.get('checks').innerHTML;
assert.match(inherited,/82 \/ 82 checks passed/,'Core and output regression checks should pass');
context.testSafeToBuy();
const safe=elements.get('safeChecks').innerHTML;
assert.match(safe,/51 \/ 51 Safe-to-Buy checks passed/,'Safe-to-Buy checks should pass');
elements.get('cash').value='400.001';
context.render();
assert.match(elements.get('flag').innerHTML,/exactly to cents/,'Core input rejects fractional cents');
assert.equal(elements.get('results').innerHTML,'','Invalid money input clears old comparison cards');
elements.get('cash').value='10000000.01';context.render();
assert.match(elements.get('flag').innerHTML,/cannot exceed R10,000,000.00/,'Core input rejects values above supported maximum');
elements.get('cash').value='400';
elements.get('receiptConfirmed').checked=true;
elements.get('balanceConfirmed').checked=true;
elements.get('currentFunds').value='650.001';
context.renderSafeToBuy();
assert.match(elements.get('safeToBuyResult').innerHTML,/exactly to cents/,'Safe-to-Buy input rejects fractional cents');
elements.get('currentFunds').value='10000000.01';context.renderSafeToBuy();
assert.match(elements.get('safeToBuyResult').innerHTML,/cannot exceed R10,000,000.00/,'Safe-to-Buy rejects values above supported maximum');
elements.get('currentFunds').value='650.01';
const c={cash:400,bank:200,receivable:300,pPay:.4,payDay:1,dateKnown:true,obligation:500,obligation2:0,priority:'first',dueDay:2,stock:250,sales:400,pSales:.75,salesLag:2,relation:'independent',emergency:0,emergencyDay:2};
const s={supplierAccepted:true,starterCost:100,minimumBatch:100,batchStep:50,reserveBuffer:0,firstDeliveryFee:0,secondDeliveryFee:0,starterSales:160,remainderSales:240,receiptConfirmed:true,clearedAmount:300,clearedDay:1,balanceConfirmed:true,obligationStatus1:'unpaid',paidAmount1:0,obligationStatus2:'none',paidAmount2:0,liabilitiesConfirmed:true,currentFunds:650.01,remainingBills:0,remainingEmergency:0};
assert.equal(context.safeToBuyPlan(c,s).secondUnlocked,true,'A valid one-cent precision amount remains usable at the expected boundary');
// Independent expected-answer cases for the corrected three-choice money engine.
const boundary={...c,cash:.30,bank:0,receivable:0,pPay:0,stock:.10,obligation:.20,obligation2:0,sales:0,pSales:0,emergency:0};
const exactCents=text=>{const [whole='0',fraction='']=text.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'))};
const refBoundary=exactCents('0.20')-(exactCents('0.30')-exactCents('0.10'));assert.equal(refBoundary>0n?refBoundary:0n,0n,'Independent BigInt oracle for cents boundary');
for(const strategy of ['now','wait','trigger']){const result=context.evaluate(boundary,strategy);assert.equal(result.risk,0,`${strategy}: R0.30 − R0.10 exactly covers R0.20`);assert.equal(result.expectedGap,0,`${strategy}: no phantom expected shortfall`);assert.equal(result.cases[0].shortfallCents,Number(refBoundary),'BigInt expected unpaid cents match engine');}
const bills={...boundary,cash:.30,stock:0,obligation:.10,obligation2:.20};assert.equal(context.evaluate(bills,'now').expectedUnpaid,0,'multiple exact-cent bills total R0.30');
const partial={...boundary,cash:.10,stock:0,receivable:.15,pPay:1,payDay:1,obligation:.30,obligation2:0,dueDay:1};const partialExpected=exactCents('0.30')-exactCents('0.10')-exactCents('0.15');assert.equal(context.evaluate(partial,'now').expectedGap,.05,'partial R0.15 receipt leaves exact R0.05 shortfall');assert.equal(context.evaluate(partial,'now').cases[0].shortfallCents,Number(partialExpected),'partial receipt agrees with independent BigInt oracle');
const emergency={...boundary,cash:.30,stock:.10,obligation:.10,obligation2:0,emergency:.10,emergencyDay:1,dueDay:1};assert.equal(context.evaluate(emergency,'now').expectedGap,0,'exact-cent purchase, bill and emergency total R0.30');
const maxCase={...c,cash:10000000,bank:10000000,receivable:10000000,pPay:1,payDay:1,obligation:10000000,obligation2:10000000,dueDay:2,stock:10000000,sales:10000000,pSales:1,salesLag:2,emergency:10000000,emergencyDay:3};const maxNow=context.evaluate(maxCase,'now');let maxRef=BigInt('2000000000')-BigInt('1000000000')+BigInt('1000000000')-BigInt('2000000000')+BigInt('1000000000')-BigInt('1000000000');assert.equal(maxRef,0n,'Independent BigInt oracle for maximum-input path');assert.equal(maxNow.cases[0].endCents,Number(maxRef),'maximum-input execution stays exact at cents');assert.equal(maxNow.expectedGap,0,'maximum-input scenario remains valid without overflow');
// Compare representative whole-rand cases to the preserved R41 code where float noise is absent.
const oldHtml=fs.readFileSync(path.join(__dirname,'reference-r41','index.html'),'utf8');
const oldScript=(oldHtml.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
function makeLegacyContext(){const oldElements=new Map(),oldDefaults=new Map();for(const m of oldHtml.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){const attrs=m[2],id=(attrs.match(/\bid="([^"]+)"/)||[])[1];if(!id)continue;const tag=m[1].toLowerCase(),type=(attrs.match(/\btype="([^"]+)"/)||[])[1]||'',value=(attrs.match(/\bvalue="([^"]*)"/)||[])[1]||'';let selected=value;if(tag==='select'){const tail=oldHtml.slice(m.index,oldHtml.indexOf('</select>',m.index));selected=(tail.match(/<option\b[^>]*\bvalue="([^"]*)"/)||[])[1]||'';}oldElements.set(id,new Element(id,selected,tag==='input'&&type==='checkbox'&&/\bchecked(?:\s|>|$)/.test(attrs)));if(tag==='input'||tag==='select')oldDefaults.set(id,{value:selected,checked:tag==='input'&&type==='checkbox'&&/\bchecked(?:\s|>|$)/.test(attrs)});}const oldDocument={getElementById:id=>oldElements.get(id)||null},oldForm={prototype:{reset(){for(const[id,d]of oldDefaults){oldElements.get(id).value=d.value;oldElements.get(id).checked=d.checked;}}}},oldContext=vm.createContext({document:oldDocument,HTMLFormElement:oldForm,console,Math,Number,Date,Set,Object,Array,String,Error,JSON});vm.runInContext(oldScript,oldContext,{timeout:5000,filename:'R41-reference-inline-app.js'});return oldContext;}
const oldContext=makeLegacyContext(),comparison={...c,cash:400,bank:200,receivable:300,pPay:.6,payDay:1,dateKnown:true,obligation:500,obligation2:0,priority:'first',dueDay:2,stock:250,sales:400,pSales:.75,salesLag:2,relation:'independent',emergency:0,emergencyDay:2};
for(const strategy of ['now','wait','trigger']){const old=oldContext.evaluate(comparison,strategy),fresh=context.evaluate(comparison,strategy);for(const key of ['risk','expectedGap','expectedEnd','expectedUnpaid','expectedNet','buyChance','salesChance'])assert.equal(fresh[key],old[key],`R41/R42 unchanged whole-rand case ${strategy}.${key}`);}
// Exercise the new obligation flow and invalidation in the DOM adapter.
elements.get('splitAccepted').value='yes';elements.get('obligationStatus1').value='paid';elements.get('liabilitiesConfirmed').checked=true;elements.get('receiptConfirmed').checked=true;elements.get('clearedAmount').value='300';elements.get('clearedDay').value='1';elements.get('balanceConfirmed').checked=true;elements.get('currentFunds').value='150';elements.get('remainingBills').value='0';context.renderSafeToBuy();assert.match(elements.get('safeToBuyResult').innerHTML,/fits this entered snapshot/,'Paid bill plus refreshed funds can unlock later batch');elements.get('obligationStatus1').value='unpaid';elements.get('obligationStatus1').handlers.input();assert.equal(elements.get('receiptConfirmed').checked,false,'Bill status change clears receipt confirmation');assert.equal(elements.get('balanceConfirmed').checked,false,'Bill status change clears balance confirmation');assert.equal(elements.get('liabilitiesConfirmed').checked,false,'Bill status change clears liability confirmation');assert.match(elements.get('safeToBuyResult').innerHTML,/Inputs changed/,'Bill status change marks old result outdated');elements.get('liabilitiesConfirmed').checked=true;elements.get('receiptConfirmed').checked=true;elements.get('balanceConfirmed').checked=true;elements.get('obligation2').value='100';elements.get('obligation2').handlers.input();assert.equal(elements.get('liabilitiesConfirmed').checked,false,'Adding another obligation clears liability confirmation');assert.match(elements.get('safeToBuyResult').innerHTML,/Inputs changed/,'Adding another obligation invalidates result');
elements.get('splitAccepted').value='yes';elements.get('cash').value='500';elements.get('obligationStatus1').value='paid';elements.get('obligationStatus2').value='unresolved';elements.get('paidAmount1').value='0';elements.get('paidAmount2').value='0';elements.get('liabilitiesConfirmed').checked=true;elements.get('receiptConfirmed').checked=true;elements.get('clearedAmount').value='300';elements.get('balanceConfirmed').checked=true;elements.get('currentFunds').value='150';elements.get('remainingBills').value='0';context.renderSafeToBuy();assert.match(elements.get('safeToBuyResult').innerHTML,/until every original bill is marked/,'Unresolved added bill keeps second batch locked');elements.get('obligation2').value='0';elements.get('obligationStatus2').value='none';elements.get('obligationStatus1').value='paid';elements.get('liabilitiesConfirmed').checked=true;elements.get('receiptConfirmed').checked=true;elements.get('balanceConfirmed').checked=true;elements.get('currentFunds').value='150';context.renderSafeToBuy();assert.match(elements.get('safeToBuyResult').innerHTML,/fits this entered snapshot/,'Previously paid bill unlocks after refreshed balance');elements.get('currentFunds').value='650.001';context.renderSafeToBuy();assert.match(elements.get('safeToBuyResult').innerHTML,/exactly to cents/,'Invalid Safe-to-Buy money replaces prior unlocked result');
console.log('R46 DOM-adapter regression: 82 inherited core/UI + 51 Safe-to-Buy checks passed; Liability-state, invalidation and stale-result UI-adapter checks passed');
console.log('R46 inherited independent monetary answer cases: BigInt boundary, three strategies, multiple bills, partial receipt, emergency passed');
console.log('R41/R46 comparison: 21 whole-rand strategy outputs matched');
console.log('R46 input precision and supported-bound UI-path assertions: 5 passed');
console.log('This Node DOM adapter exercises application functions and generated output; it is not a real browser audit.');









