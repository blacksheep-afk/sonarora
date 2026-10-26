import { useReducer, useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { AppIcon } from './components/AppIcon';
import { ResultOverview, ComparisonCards, MoneyMap, ROUNDING_NOTICE } from './components/DecisionViews';
import type { Strategy } from './components/DecisionViews';
import { Shield01Icon, Wallet01Icon, MoneyReceive01Icon, Invoice01Icon, ShoppingCart01Icon, InformationCircleIcon, File01Icon, ArrowRight01Icon, ArrowLeft01Icon, ArrowDown01Icon, SlidersHorizontalIcon, PrinterIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { compareDraft, safeDraft, exampleDraft, exampleSafe, errorsFor, describeReason, moneyText } from './application/adapter';
import type { ScenarioField, SafeField, Draft, SafeDraft } from './application/adapter';
import { newSession, sessionReducer, ticketFor, visibleSnapshot } from './application/session';
import type { ConfirmationKind, Session } from './application/session';
const labels: Record<ScenarioField, string> = { cash: 'Cash you have (R)', bank: 'Money in your bank (R)', receivable: 'Payment you expect (R)', receiptTiming: 'Do you know the payment day?', receiptDay: 'Payment day', bill1: 'Bill you must pay (R)', bill2: 'Another bill you must pay (R)', dueDay: 'Bill due day', billPriority: 'Which bill comes first?', stockCost: 'Cost of stock (R)', grossSales: 'Sales money before costs (R)', salesLagDays: 'Days until sales', emergencyAmount: 'Money for emergencies (R)', emergencyDay: 'Day of the emergency', receiptProbability: 'How likely is it to arrive?', salesProbability: 'Chance of sales (0–1)', relation: 'How the two chances work together' };
const safeLabels: Record<SafeField, string> = { splitAcceptance: 'Will the supplier sell in smaller batches?', minimumBatch: 'Smallest order the supplier allows (R)', increment: 'Order size steps (R; enter 0 if none)', firstDeliveryFee: 'First delivery cost (R)', secondDeliveryFee: 'Next delivery cost (R)', starterCost: 'First stock purchase (R)', starterGrossSalesEstimate: 'Sales from the first batch, before costs (R)', remainderGrossSalesEstimate: 'Sales from the next batch, before costs (R)', buffer: 'Extra money to keep aside (R)', receiptReported: 'Has the payment arrived?', receiptAmount: 'Payment that arrived (R)', receiptDayReported: 'Day the payment arrived (0 or later)', balanceReported: 'Do you know your balance now?', clearedBalance: 'Money you have now, including the payment (R)', remainingOtherBills: 'Other bills still to pay (R)', remainingEmergency: 'Emergency costs still to pay (R)', bill1Status: 'Have you paid bill 1?', bill2Status: 'Have you paid bill 2?', bill1Paid: 'Bill 1 amount already paid (R)', bill2Paid: 'Bill 2 amount already paid (R)', bill1Outstanding: 'Bill 1 still to pay (R)', bill2Outstanding: 'Bill 2 still to pay (R)' };

type Page = 'inputs' | 'comparison' | 'safe-to-buy';
function pageFromHash(): Page { return location.hash === '#comparison' ? 'comparison' : location.hash === '#safe-to-buy' ? 'safe-to-buy' : 'inputs'; }
const probabilityChoices = [['0', 'Will not arrive'], ['0.25', 'Unlikely'], ['0.5', 'Maybe'], ['0.75', 'Likely'], ['0.9', 'Very likely'], ['1', 'Will arrive']] as const;
const extraFields: readonly string[] = ['bill2','receiptTiming','billPriority','grossSales','salesLagDays','salesProbability','relation','emergencyAmount','emergencyDay'];
const dayHints: Partial<Record<ScenarioField,string>> = { receiptDay: 'Day 1–14, counted from today.', dueDay: 'Day 1–14. Both bills share this day.', emergencyDay: 'Day 1–14, counted from today.', salesLagDays: '1–14 days after buying the stock.' };
const moneyFields: readonly string[] = ['cash', 'bank', 'receivable', 'bill1', 'bill2', 'stockCost', 'grossSales', 'emergencyAmount'];
export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, newSession);
  const [page, setPage] = useState<Page>(pageFromHash);
  const [selected, setSelected] = useState<Strategy>('now');
  const [path, setPath] = useState(0);
  const [extras, setExtras] = useState(false);
  const [checkpoint, setCheckpoint] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [item, setItem] = useState('');
  const modalFocusRef = useRef<string|null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const errors = errorsFor(state.issues), snapshot = visibleSnapshot(state);
  const errorEntries = Object.entries(errors);
  const errorItem = ([key, message]: [string, string]) => <p key={key}>{key in labels || key in safeLabels ? <><a href={'#' + key} onClick={event => { event.preventDefault(); focusField(key); }}>{labels[key as ScenarioField] ?? safeLabels[key as SafeField]}</a><span className="error-instruction">{message}</span></> : message}</p>;
  useEffect(() => { const update = () => { setPage(pageFromHash()); document.documentElement.scrollTop = 0; }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  const navigate = (next: Page) => { setPage(next); if (location.hash !== '#' + next) location.hash = next; document.documentElement.scrollTop = 0; };
  const focusField = (id: string) => {
    setPage(id in safeLabels ? 'safe-to-buy' : 'inputs');
    if(id in safeLabels)setCheckpoint(true);
    else {setCheckpoint(false);setExtras(extraFields.includes(id));}
    modalFocusRef.current=id;
    setFocusTarget(id);
  };
  useEffect(() => {
    if (state.failure) { alertRef.current?.focus(); return; }
    const first = Object.keys(errorsFor(state.issues))[0];
    if (state.issues.length) {
      if (first && (first in labels || first in safeLabels)) {
        setPage(first in safeLabels ? 'safe-to-buy' : 'inputs');
        if(first in safeLabels)setCheckpoint(true);
        else {setCheckpoint(false);setExtras(extraFields.includes(first));}
        modalFocusRef.current=first;
        setFocusTarget(first);
      } else alertRef.current?.focus();
    }
  }, [state.issues, state.failure]);
  useEffect(() => {
    if (focusTarget && !extraFields.includes(focusTarget)) { if (!focusInput(focusTarget, formRef.current)) alertRef.current?.focus(); setFocusTarget(null); }
  }, [focusTarget, page, extras]);
  const edit = (draft: Draft, s: SafeDraft) => dispatch({ type: 'edit', session: state.id, draft, safeDraft: s });
  const change = (key: ScenarioField, value: string) => edit({ ...state.draft, [key]: value }, state.safeDraft);
  const changeSafe = (key: SafeField, value: string) => edit(state.draft, { ...state.safeDraft, [key]: value });
  const calculate = (captured: Session, kind: 'comparison' | 'safe', openComparison: boolean) => {
    if (captured.pending) return;
    const ticket = ticketFor(captured, kind); dispatch({ type: 'begin', ticket });
    if (openComparison) navigate('comparison');
    setTimeout(() => {
      try {
        const result = kind === 'comparison' ? compareDraft(captured.draft) : safeDraft(captured.draft, captured.safeDraft, captured.decision.inputRevision, captured.decision.confirmations);
        dispatch({ type: 'complete', ticket, result });

      } catch { dispatch({ type: 'failure', ticket }); }
    }, 0);
  };
  const run = (kind: 'comparison' | 'safe') => calculate(state, kind, kind === 'comparison');
  const loadExample = () => {
    const action = { type: 'edit', session: state.id, draft: exampleDraft, safeDraft: exampleSafe } as const;
    const next = sessionReducer(state, action); dispatch(action); setSelected('now'); setPath(0);
    calculate(next, 'comparison', false);
  };
  const reset = () => { dispatch({ type: 'reset' }); setSelected('now'); setPath(0); setNotes(''); setItem(''); setExtras(false); setCheckpoint(false); navigate('inputs'); };
  const field = (key: ScenarioField, options?: readonly (readonly [string, string])[], hint?: string, icon?: React.ReactNode) => <Field icon={icon} key={key} id={key} label={labels[key]} value={state.draft[key]} error={errors[key]} options={options} money={moneyFields.includes(key)} description={hint ?? dayHints[key] ?? (key === 'relation' ? options?.find(([value]) => value === state.draft[key])?.[1] : undefined)} change={v => change(key, v)} />;
  const safeField = (key: SafeField, options?: readonly (readonly [string, string])[]) => <Field key={key} id={key} label={safeLabels[key]} value={state.safeDraft[key]} error={errors[key]} options={options} money={!options && key !== 'receiptDayReported'} change={v => changeSafe(key, v)} />;
  const dirty = state.decision.inputRevision > 0 && !snapshot;
  const pending = state.pending !== null;
  const notices = <>
    {state.failure && <div role="alert" ref={alertRef} tabIndex={-1} className="error-summary"><AppIcon icon={InformationCircleIcon} /><div><h2>Something went wrong. Let’s try again.</h2><p>{state.failure}</p><div className="error-actions"><Button type="button" onClick={() => run(page === 'safe-to-buy' ? 'safe' : 'comparison')}>Try again</Button><Button type="button" variant="outline" onClick={() => focusField('cash')}>Review your inputs</Button></div></div></div>}
    {errorEntries.length > 0 && <div role="alert" className="error-summary" ref={alertRef} tabIndex={-1}><h2>{errorEntries.length === 1 ? 'One detail to check' : 'Let’s check a few details'}</h2><p>Your numbers are still here. {errorEntries.length > 1 ? 'Start with this one, then compare again.' : 'Check this, then try again.'}</p>{errorEntries[0] && errorItem(errorEntries[0])}{errorEntries.length > 1 && <details className="error-list"><summary>See all {errorEntries.length} details to check</summary>{errorEntries.slice(1).map(errorItem)}</details>}</div>}
  </>;
  const resultPanel = <>
    <div className="section-heading"><div><h2 id="result-title">Your result</h2><p>Based on the information you entered.</p></div><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" className="print-button" onClick={() => window.print()} disabled={!snapshot}><AppIcon icon={PrinterIcon} size="inline" />Print</Button></TooltipTrigger><TooltipContent>Print this result</TooltipContent></Tooltip></div>
    {snapshot ? <ResultOverview snapshot={snapshot} selected={selected} onSelect={key => { setSelected(key); setPath(0); }} onCompare={() => navigate('comparison')} /> : <div className="empty-result"><AppIcon icon={dirty ? InformationCircleIcon : Shield01Icon} size="hero" /><h3>{dirty ? 'Inputs changed, compare again' : 'A clearer view of your options'}</h3><p>{dirty ? 'Your previous results and confirmations have been cleared.' : 'Enter your numbers or use the invented example to explore the trade-offs.'}</p><Button type="button" variant="outline" onClick={dirty ? () => run('comparison') : loadExample}>{dirty ? 'Compare options' : 'Use example'}</Button></div>}
    <p className="result-disclaimer">These are calculated examples, not financial advice. We have not checked your bank account or payments.</p>
  </>;
  return <TooltipProvider delayDuration={500}><main className="decision-app">
    <header className="app-header"><div className="compact-brand"><h1>Sonarora</h1><p>See the trade-offs before you buy stock.</p></div><nav aria-label="Workflow">{([['inputs', 'Your money'], ['comparison', 'Compare options'], ['safe-to-buy', 'Check a purchase']] as const).map(([key, name], i) => <a key={key} href={'#' + key} onClick={() => setPage(key)} aria-current={page === key ? 'step' : undefined}><span className="step-number" aria-hidden="true">{i + 1}</span><span>{name}</span></a>)}</nav></header>
    <Alert className="prototype-alert" role="note"><AppIcon icon={InformationCircleIcon} size="inline" /><AlertDescription>Sonarora is an independent financial planning prototype created for a hackathon. It is not an official FNB service, is not affiliated with or endorsed by FNB, and does not connect to real bank accounts or make payments. All results are modelled simulations based on information entered by the user.</AlertDescription></Alert>
    {page !== 'inputs' && <div className="back-row"><Button type="button" variant="ghost" onClick={() => navigate('inputs')}><AppIcon icon={ArrowLeft01Icon} size="inline" />Back to your money</Button></div>}
    {!checkpoint && notices}
    <div className="sr-only" role="status" aria-live="polite">{pending ? '' : snapshot ? 'Comparison ready for the current inputs.' : dirty ? 'Inputs changed, compare again.' : ''}</div>
    <form ref={formRef} noValidate onSubmit={e => { e.preventDefault(); run('comparison'); }}>
      <div className="home-workspace" hidden={page !== 'inputs'}>
        <section id="inputs" className="input-panel" aria-labelledby="inputs-title">
          <div className="section-heading"><div><h2 id="inputs-title">Your money</h2><p>Enter a few details to see your options.</p></div><Button type="button" variant="secondary" className="example-button" onClick={loadExample} disabled={pending}><AppIcon icon={File01Icon} size="inline" />Use example</Button></div>
          <div className="input-groups aligned-inputs">
            {field('cash', undefined, 'Money you can spend now.', <AppIcon icon={Wallet01Icon} size="inline" />)}
            {field('receivable', undefined, 'Payment you expect to receive.', <AppIcon icon={MoneyReceive01Icon} size="inline" />)}
            {field('bank')}
            {state.draft.receiptTiming === 'known' ? field('receiptDay') : <div className="field"><p className="field-hint">If the day is unknown, we leave this payment out.</p></div>}
            {field('bill1', undefined, 'Rent, electricity or another essential bill.', <AppIcon icon={Invoice01Icon} size="inline" />)}
            <Field id="receiptProbability" label="How likely is it to arrive?" value={state.draft.receiptProbability} error={errors.receiptProbability} options={probabilityChoices} description="Your best guess, not a guarantee." change={value=>change('receiptProbability',value)} />
            {field('dueDay')}
            {field('stockCost', undefined, 'The full stock or item purchase cost.', <AppIcon icon={ShoppingCart01Icon} size="inline" />)}
          </div>
          <p id="planning-days-hint" className="field-hint planning-days-hint">This prototype plans dates for the next 14 days: day 1 is tomorrow, and day 14 is two weeks from today.</p>
          <div className="form-actions home-actions"><Dialog open={extras} onOpenChange={setExtras}><DialogTrigger asChild><Button type="button" variant="outline" className="more-details-button" onClick={()=>{modalFocusRef.current=null;}}><AppIcon icon={SlidersHorizontalIcon} size="inline" />More details</Button></DialogTrigger><DialogContent container={formRef.current} className="details-dialog" onOpenAutoFocus={event=>{event.preventDefault();focusInput(modalFocusRef.current??'bill2',formRef.current);modalFocusRef.current=null;setFocusTarget(null);}} onKeyDown={event=>{if(event.key==='Enter' && event.target instanceof HTMLInputElement)event.preventDefault();}}><DialogHeader><DialogTitle>More details</DialogTitle><DialogDescription>Other bills, sales and optional notes. Changes are applied as you enter them.</DialogDescription></DialogHeader><div className="details-dialog-body"><p className="quiet-note">Add the other numbers used in this example. Enter 0 if there is none. Days run from 1 to 14; the example ends on Day 30.</p><div className="fields">{field('bill2',undefined,'Uses the same bill due day as the main page.')}{field('receiptTiming', [['known', 'I know the day'], ['unknown', 'I do not know — leave this payment out']])}{field('billPriority', [['first', 'Bill 1 first'], ['second', 'Bill 2 first']])}{field('grossSales')}{field('salesLagDays')}{field('salesProbability')}{field('relation', [['independent', 'Separate — each chance is used on its own'], ['linked', 'Linked — use the lower chance for both']])}{field('emergencyAmount')}{field('emergencyDay')}</div><p className="quiet-note">Sales money is before costs, not profit. The chances are your best guesses. If the payment day is unknown, it is left out. Sales arriving after a bill is due cannot pay it on time.</p><div className="field input-subfields"><Label htmlFor="purchase-note">What is it? (optional)</Label><Input id="purchase-note" value={item} onChange={e => setItem(e.target.value)} maxLength={200} placeholder="e.g. stock for your shop" /></div><div className="field"><Label htmlFor="notes">Notes (optional)</Label><textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} placeholder="Add any other information…" aria-describedby="notes-hint" /><p id="notes-hint" className="field-hint">Notes disappear on reload. They do not affect the calculation.</p></div></div><DialogFooter><DialogClose asChild><Button type="button">Done</Button></DialogClose></DialogFooter></DialogContent></Dialog>
          <Button type="submit" disabled={pending}>Compare options<AppIcon icon={ArrowRight01Icon} size="inline" /></Button><Button type="button" variant="secondary" onClick={reset}>Clear all</Button></div><p className="example-caption">The example is invented. Changing a number clears the old result.</p>
        </section>
        <section className="result-panel" aria-labelledby="result-title" aria-busy={pending}>{resultPanel}</section>
      </div>
      <section id="comparison" className="compare-page" hidden={page !== 'comparison'} aria-labelledby="comparison-title" aria-busy={pending}>
        {snapshot && page === 'comparison' ? <><ComparisonCards snapshot={snapshot} onPlan={() => navigate('safe-to-buy')} /><details className="comparison-map"><summary>See the Money Map</summary><MoneyMap snapshot={snapshot} selected={selected} onSelect={setSelected} path={path} onPath={setPath} /></details><details className="model-limits"><summary>How this example works</summary><p>Receipt: {snapshot.draft.receiptProbability}; sales: {snapshot.draft.salesProbability}; relationship: {snapshot.draft.relation}; receipt timing: {snapshot.draft.receiptTiming === 'known' ? `Day ${snapshot.draft.receiptDay}` : 'unknown, excluded'}; shared bill due day: {snapshot.draft.dueDay}; priority: {snapshot.draft.billPriority}; sales lag: {snapshot.draft.salesLagDays} days.</p><p>The waiting option tries to buy once, the day after bills are due. A missed bill stays unpaid even if money arrives later. The ring covers bills you must pay. Unpaid emergency costs appear in the full numbers. Taxes, interest and costs you have not entered are left out.</p></details></> : !pending ? <div className="empty-result"><AppIcon icon={InformationCircleIcon} size="hero" /><h2 id="comparison-title">{dirty ? 'Inputs changed, compare again' : 'Compare options'}</h2><p>Complete your numbers to see a current comparison.</p><Button type="button" onClick={() => navigate('inputs')}>Return to your money</Button></div> : null}
      </section>
      <Dialog open={checkpoint} onOpenChange={setCheckpoint}><section id="safe-to-buy" className="purchase-page" hidden={page !== 'safe-to-buy'} aria-labelledby="safe-title">
        <div className="section-heading"><div><h2 id="safe-title">Plan a safer purchase</h2><p>See whether buying smaller batches could work.</p></div></div>
        <Alert className="guidance-alert" role="note"><AppIcon icon={InformationCircleIcon} size="inline" /><AlertDescription>This is a separate check using the latest numbers you enter. It does not approve a purchase.</AlertDescription></Alert>
        <div className="purchase-layout"><div className="plan-overview"><h3>Buy in smaller steps</h3><ol className="plan-steps">{[['Wait for the expected payment', 'Wait until the money arrives. Keep bill money aside.'], ['Check whether it arrived', 'Enter the payment, your balance now and bills already paid.'], ['Check a smaller first purchase', 'Add the supplier’s rules, delivery costs and money for bills.'], ['Check the rest later', 'Update your numbers before checking whether you can buy the rest.']].map(([title, copy], i) => <li key={title}><span className="plan-step-number" aria-hidden="true">{i === 1 && state.decision.confirmations.receipt ? <AppIcon icon={CheckmarkCircle02Icon} size="inline" /> : i + 1}</span><div><h4>{title}</h4><p>{copy}</p></div></li>)}</ol><p className="plan-guidance">You decide what to do. We have not checked your bank account or payments.</p></div><aside className="your-numbers"><h3>Your numbers</h3><dl><dt>Cash you have</dt><dd>{state.draft.cash ? 'R ' + state.draft.cash : 'Not entered'}</dd><dt>Payment you expect</dt><dd>{state.draft.receivable ? 'R ' + state.draft.receivable : 'Not entered'}<small>{state.draft.receiptTiming === 'known' && state.draft.receiptDay ? 'Expected Day ' + state.draft.receiptDay : 'Day unknown'}</small></dd><dt>Bill you must pay</dt><dd>{state.draft.bill1 ? 'R ' + state.draft.bill1 : 'Not entered'}<small>{state.draft.dueDay ? 'Due Day ' + state.draft.dueDay : 'Due day not entered'}</small></dd><dt>Item to buy</dt><dd>{state.draft.stockCost ? 'R ' + state.draft.stockCost : 'Not entered'}{item && <small>{item}</small>}</dd></dl><DialogTrigger asChild><Button type="button" className="full-width" onClick={() => { setPage('safe-to-buy');modalFocusRef.current=null; }}>I understand and want to continue<AppIcon icon={ArrowRight01Icon} size="inline" /></Button></DialogTrigger></aside></div>
        <DialogContent container={formRef.current} className="details-dialog purchase-dialog" onOpenAutoFocus={event=>{event.preventDefault();focusInput(modalFocusRef.current??'splitAcceptance',formRef.current);modalFocusRef.current=null;setFocusTarget(null);}} onKeyDown={event=>{if(event.key==='Enter' && event.target instanceof HTMLInputElement)event.preventDefault();}}><DialogHeader><DialogTitle>Check smaller purchases</DialogTitle><DialogDescription>Add the supplier’s rules and what you have paid. This check is not permission to buy or financial advice.</DialogDescription></DialogHeader><div className="details-dialog-body staged-checkpoint">{notices}
            <details><summary>Supplier rules and first purchase</summary><div className="fields">{safeField('splitAcceptance', [['unreported', 'Not sure yet'], ['accepted', 'Yes'], ['not-accepted', 'No']])}{(['minimumBatch', 'increment', 'firstDeliveryFee', 'secondDeliveryFee', 'starterCost', 'starterGrossSalesEstimate', 'remainderGrossSalesEstimate', 'buffer'] as const).map(k => safeField(k))}</div><p>The first check keeps money aside for the full bills, emergencies and extra savings. The next check uses bills still to pay and your latest balance. Sales left over are not profit.</p></details>
          <details><summary>Bills paid and bills still to pay</summary><p>Compare the original bill amounts with payments already made and amounts still owed.</p>{(['bill1', 'bill2'] as const).map(key => <fieldset key={key}><legend>{key === 'bill1' ? 'Original bill 1' : 'Original bill 2'}</legend><div className="fields">{safeField(`${key}Status`, [['unresolved', 'Not sure yet'], ['unpaid', 'Not paid'], ['partial', 'Partly paid'], ['paid', 'Paid']])}{state.safeDraft[`${key}Status`] === 'partial' && safeField(`${key}Paid`)}{state.safeDraft[`${key}Status`] !== 'unresolved' && safeField(`${key}Outstanding`)}</div><p>If this bill is 0, there is nothing to pay.</p></fieldset>)}</details>
          <details><summary>Payment received and balance now</summary><div className="fields">{safeField('receiptReported', [['no', 'Not yet'], ['yes', 'Yes, the payment arrived']])}{state.safeDraft.receiptReported === 'yes' && <>{safeField('receiptAmount')}{safeField('receiptDayReported')}</>}{safeField('balanceReported', [['no', 'Not entered yet'], ['yes', 'Yes, I entered my balance now']])}{state.safeDraft.balanceReported === 'yes' && <>{safeField('clearedBalance')}{safeField('remainingOtherBills')}{safeField('remainingEmergency')}</>}</div><p>Your latest balance must already include the payment. We do not add it again.</p></details>
          <fieldset><legend>Confirm the numbers you entered</legend>{(['receipt', 'balance', 'liabilities'] as ConfirmationKind[]).map(kind => <label className="check" key={kind}><input type="checkbox" checked={state.decision.confirmations[kind] !== null} disabled={(kind === 'receipt' && state.safeDraft.receiptReported !== 'yes') || (kind === 'balance' && state.safeDraft.balanceReported !== 'yes')} onChange={e => dispatch({ type: 'confirm', session: state.id, revision: state.decision.inputRevision, kind, checked: e.target.checked })} />{kind === 'liabilities' ? 'I confirm the bills paid and money still owed. Sonarora has not checked this.' : kind === 'receipt' ? 'I confirm the payment I entered. Sonarora has not checked it.' : 'I confirm the balance I entered. Sonarora has not checked it.'}</label>)}</fieldset>
          <Button type="button" className="primary" disabled={state.pending !== null} onClick={() => run('safe')}>Check smaller purchases</Button>
          <div role="status" aria-live="polite" data-testid="safe-result" aria-busy={state.pending?.kind === 'safe'}>{!state.plan ? <p>Add your numbers, then check the purchase.</p> : <><h3>{state.plan.status === 'modelled-feasible' ? 'First purchase: fits these numbers' : state.plan.status === 'blocked' ? 'This purchase does not fit yet' : 'Add the missing details'}</h3><ul>{state.plan.explanations.map((e, i) => <li key={i}>{describeReason(e.code)}</li>)}</ul>{state.plan.status === 'modelled-feasible' && <><h3>Next purchase: {state.plan.later.status === 'locked' ? 'wait' : 'fits these numbers'}</h3>{state.plan.later.status === 'locked' && <ul>{state.plan.later.explanations.map((e, i) => <li key={i}>{describeReason(e.code)}</li>)}</ul>}</>}{state.plan.diagnostics && <dl><dt>First stock and delivery cost</dt><dd>{moneyText(state.plan.diagnostics.starterSpend)}</dd><dt>Money left after the first purchase</dt><dd>{moneyText(state.plan.diagnostics.firstBalance)}</dd><dt>First sales minus stock and delivery (not profit)</dt><dd>{moneyText(state.plan.diagnostics.starterExpectedSurplus)}</dd><dt>Next sales minus stock and delivery (not profit)</dt><dd>{moneyText(state.plan.diagnostics.remainderExpectedSurplus)}</dd><dt>Money kept for bills and emergencies</dt><dd>{moneyText(state.plan.diagnostics.reserve)}</dd><dt>Balance you entered (payment included)</dt><dd>{moneyText(state.plan.diagnostics.currentFunds)}</dd><dt>Money still needed for bills</dt><dd>{moneyText(state.plan.diagnostics.remainingReserve)}</dd><dt>Money left to buy the rest</dt><dd>{moneyText(state.plan.diagnostics.availableForRemainder)}</dd><dt>Next stock and delivery cost</dt><dd>{moneyText(state.plan.diagnostics.remainderSpend)}</dd></dl>}<p>{ROUNDING_NOTICE}</p><p>This is only a calculation. We have not checked the supplier or your payments. No money is moved.</p></>}</div>

        </div><DialogFooter><DialogClose asChild><Button type="button">Done</Button></DialogClose></DialogFooter></DialogContent>
      </section></Dialog>
    </form>
    <footer><p>Independent prototype. No bank connection or payments. Nothing is saved.</p></footer>
  </main></TooltipProvider>;
}

function Field({ id, label, icon, value, error, options, description, money = false, change }: { id: string; label: string; icon?: React.ReactNode; value: string; error: string | undefined; description?: string | undefined; options: readonly (readonly [string, string])[] | undefined; money?: boolean; change: (value: string) => void }) {
  const props = { id, value, 'aria-invalid': error ? true : undefined, 'aria-describedby': [error ? id + '-error' : null, description ? id + '-description' : null, ['receiptDay','dueDay','emergencyDay'].includes(id)?'planning-days-hint':null].filter(Boolean).join(' ') || undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => change(event.target.value) };
  return <div className="field"><Label htmlFor={id}>{icon}{label}</Label>{options ? <div className="select-input"><select {...props}>{options.length && !options.some(([option])=>option===value) && <option value="" disabled>Choose an option</option>}{options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><AppIcon icon={ArrowDown01Icon} size="inline" /></div> : <div className={money ? 'money-input' : 'plain-input'}>{money && <span aria-hidden="true">R</span>}<Input {...props} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} /></div>}{description && <p id={id + '-description'} className="field-hint">{description}</p>}{error && <span id={id + '-error'} className="error">{error}</span>}</div>;
}
function focusInput(id: string, form: HTMLFormElement | null): boolean {
  const control = document.getElementById(id);
  if (!control || !form?.contains(control) || !(control instanceof HTMLElement)) return false;
  let ancestor = control.parentElement;
  while (ancestor) { if (ancestor instanceof HTMLDetailsElement) ancestor.open = true; ancestor = ancestor.parentElement; }
  control.focus(); return document.activeElement === control;
}
