import { useState } from 'react';
import { cva } from 'class-variance-authority';
import { ShieldCheckIcon, ShoppingCart01Icon, Clock01Icon, ArrowRight01Icon, GridTableIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AppIcon } from './AppIcon';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ChartContainer } from './ui/chart';
import { moneyText, eventText, pathLabel, describeReason, comparisonHeading } from '../application/adapter';
import type { Snapshot, DecisionComparison } from '../application/adapter';

export type Strategy = keyof DecisionComparison['strategies'];
export const strategyOrder: readonly Strategy[] = ['now', 'wait', 'trigger'];
export const strategyNames = { now: 'Buy now', wait: 'Wait until after bill day', trigger: 'Buy after payment arrives' };
const strategyCopy = {
  now: 'Buy the stock now and pay bills when they fall due.',
  wait: 'Wait until after the bill is due, then try to buy stock.',
  trigger: 'Buy only if the payment arrives and there is enough left for bills.',
};
const strategyIcons = { now: ShoppingCart01Icon, wait: ShieldCheckIcon, trigger: Clock01Icon };
const tones = { now: 'high', wait: 'medium', trigger: 'low' } as const;
const strategyVariants = cva('strategy-card', { variants: { strategy: { now: 'strategy-now', wait: 'strategy-wait', trigger: 'strategy-trigger' } } });
export const ROUNDING_NOTICE = 'R51 rounding limitation: weighted half cents use binary arithmetic. For example, 50 cents × 0.29 can display R0.14 instead of decimal half-up R0.15. Expected amounts round separately; displayed totals may not subtract exactly. Exact transaction paths remain integer cents.';

export function RiskDonut({ risk, strategy, mini = false }: { risk: number; strategy: Strategy; mini?: boolean }) {
  return <div className={cn('risk-donut', `risk-${tones[strategy]}`, mini && 'risk-donut-mini')}>
    <ChartContainer staticChart config={{ risk: { label: 'Chance of an unpaid essential bill' } }} className="donut-chart" initialDimension={{ width: 200, height: 200 }}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="donut-svg">
        <circle className="donut-track" cx="60" cy="60" r="48" fill="none" strokeWidth="16" />
        <circle className="donut-value" cx="60" cy="60" r="48" fill="none" strokeWidth="16"
          pathLength="100" strokeDasharray={`${risk} 100`} transform="rotate(-90 60 60)" />
      </svg>
    </ChartContainer>
    <div className="donut-label"><strong>{risk}%</strong><span>Chance of missing a bill</span></div>
    <span className="sr-only">{strategyNames[strategy]}: {risk}% calculated chance of missing a bill you must pay on time.</span>
  </div>;
}

export function ResultOverview({ snapshot, selected, onSelect, onCompare }: { snapshot: Snapshot; selected: Strategy; onSelect: (key: Strategy) => void; onCompare: () => void }) {
  const [table, setTable] = useState(false);
  return <>
    <div className="result-highlight">
      <AppIcon icon={ShieldCheckIcon} tone="low" size="feature" />
      <div><p className="result-kicker">Lowest chance of missing a bill</p><h3>{comparisonHeading(snapshot.comparison)}</h3>
        <p>Based on your numbers. This is not a promise or advice to buy.</p></div>
    </div>
    <div className="section-heading"><h3>Compare your options</h3><Button type="button" variant="ghost" className="small-action" aria-pressed={table} onClick={() => setTable(!table)}><AppIcon icon={GridTableIcon} size="inline" />{table ? 'View chart' : 'View as table'}</Button></div>
    {table ? <RiskTable comparison={snapshot.comparison} /> : <div className="overview-chart">
      <RiskDonut risk={snapshot.comparison.strategies[selected].modelledShortfallRisk} strategy={selected} />
      <div className="strategy-legend" aria-label="Select a strategy for the chart">{strategyOrder.map(key => <Button type="button" variant="ghost" key={key} className={cn('legend-row', `risk-${tones[key]}`)} aria-pressed={selected === key} onClick={() => onSelect(key)}>
        <AppIcon icon={strategyIcons[key]} size="inline" tone={tones[key]} /><span>{strategyNames[key]}</span><strong>{snapshot.comparison.strategies[key].modelledShortfallRisk}%</strong><AppIcon icon={ArrowRight01Icon} size="inline" />
      </Button>)}</div>
    </div>}
    <p className="chart-caption">The ring shows the chance for {strategyNames[selected].toLowerCase()}.</p>
    <Button type="button" variant="outline" className="full-width" onClick={onCompare}>Compare all options <AppIcon icon={ArrowRight01Icon} size="inline" /></Button>
  </>;
}

function RiskTable({ comparison }: { comparison: DecisionComparison }) {
  return <Table><TableCaption>Calculated chance of missing a bill you must pay. Not financial advice.</TableCaption><TableHeader><TableRow><TableHead>Option</TableHead><TableHead>Chance</TableHead></TableRow></TableHeader><TableBody>{strategyOrder.map(key => <TableRow key={key}><TableCell>{strategyNames[key]}</TableCell><TableCell>{comparison.strategies[key].modelledShortfallRisk}%</TableCell></TableRow>)}</TableBody></Table>;
}

export function ComparisonCards({ snapshot, onPlan }: { snapshot: Snapshot; onPlan: () => void }) {
  const [view, setView] = useState('cards');
  return <Tabs value={view} onValueChange={setView}>
    <div className="section-heading"><div><h2 id="comparison-title">Compare options</h2><p>See what could happen with each choice.</p></div><div className="view-toggle"><TabsList aria-label="Comparison view"><TabsTrigger value="cards">Cards</TabsTrigger><TabsTrigger value="table"><AppIcon icon={GridTableIcon} size="inline" />List</TabsTrigger></TabsList></div></div>
    <p className="quiet-note">Calculated examples, not financial advice. We have not checked your numbers. Full details include emergency costs.</p>
      <TabsContent value="cards" forceMount hidden={view !== 'cards'}>
        <div className="strategies" data-testid="strategies">{strategyOrder.map(key => {
          const r = snapshot.comparison.strategies[key];
          return <Card key={key} className={strategyVariants({ strategy: key })} data-strategy={key}>
            <div className="strategy-title"><AppIcon icon={strategyIcons[key]} tone={tones[key]} /><h3>{strategyNames[key]}</h3></div><p className="strategy-description">{strategyCopy[key]}</p>
            <RiskDonut risk={r.modelledShortfallRisk} strategy={key} mini />

            <div className="key-points"><strong>Key points</strong><ul>{key === 'wait' && <li>A bill could still be unpaid when stock is bought.</li>}{key === 'trigger' && <li>Buy only after the payment arrives, with bill money kept aside.</li>}{r.explanations.map((e, i) => <li key={i}>{describeReason(e.code)}</li>)}</ul></div>
            <details className="strategy-details"><summary>See full details</summary><dl className="strategy-metrics"><dt>Chance of not paying all essential bills on time</dt><dd>{r.modelledShortfallRisk}%</dd><dt>Average bills and costs still unpaid</dt><dd>{moneyText(r.expectedUnpaid)}</dd><dt>Average money left</dt><dd>{moneyText(r.expectedEndBalance)}</dd><dt>Money left after unpaid bills and costs</dt><dd>{moneyText(r.expectedNetAfterUnpaid)}</dd><dt>Chance of buying stock</dt><dd>{r.purchaseChance}%</dd></dl><dl><dt>Average unpaid bill 1 / bill 2</dt><dd>{moneyText(r.expectedUnpaidByBill['bill-1'])} / {moneyText(r.expectedUnpaidByBill['bill-2'])}</dd><dt>Average essential bills still unpaid</dt><dd>{moneyText(r.expectedShortfall)}</dd></dl><p>Money left is an average for Day 30. Money left after unpaid bills is not money you can spend.</p></details>
          </Card>;
        })}</div>
      </TabsContent>
      <TabsContent value="table"><p id="comparison-scroll-hint" className="quiet-note comparison-scroll-hint">Scroll sideways to see every column.</p><Table className="comparison-table" containerProps={{ tabIndex: 0, role: 'region', 'aria-label': 'Comparison figures', 'aria-describedby': 'comparison-scroll-hint' }}><TableCaption>These are averages, rounded one at a time. Money after unpaid costs is not money you can spend.</TableCaption><TableHeader><TableRow><TableHead>Option</TableHead><TableHead>Chance of missing a bill</TableHead><TableHead>Average unpaid</TableHead><TableHead>Money left</TableHead><TableHead>After unpaid costs</TableHead><TableHead>Purchase chance</TableHead></TableRow></TableHeader><TableBody>{strategyOrder.map(key => {const r = snapshot.comparison.strategies[key]; return <TableRow key={key}><TableCell>{strategyNames[key]}</TableCell><TableCell>{r.modelledShortfallRisk}%</TableCell><TableCell>{moneyText(r.expectedUnpaid)}</TableCell><TableCell>{moneyText(r.expectedEndBalance)}</TableCell><TableCell>{moneyText(r.expectedNetAfterUnpaid)}</TableCell><TableCell>{r.purchaseChance}%</TableCell></TableRow>;})}</TableBody></Table></TabsContent>
    <p className="quiet-note rounding-note">Amounts are estimates. Small rounding differences can occur.</p><details className="rounding-details"><summary>About rounding</summary><p>{ROUNDING_NOTICE}</p></details>
    <div className="compare-actions"><p>Could buying smaller batches help?</p><Button type="button" onClick={onPlan}>Plan a safer purchase <AppIcon icon={ArrowRight01Icon} size="inline" /></Button></div>
  </Tabs>;
}

export function MoneyMap({ snapshot, selected, onSelect, path, onPath, compact = false }: { snapshot: Snapshot; selected: Strategy; onSelect: (key: Strategy) => void; path: number; onPath: (value: number) => void; compact?: boolean }) {
  const [table, setTable] = useState(false);
  const outcomes = snapshot.comparison.strategies[selected].outcomes;
  const index = path < outcomes.length ? path : 0;
  const outcome = outcomes[index];
  if (!outcome) return null;
  return <section className={cn("money-map", compact && "money-map-compact")} aria-labelledby="map-title">
    <div className="section-heading"><h3 id="map-title">Money Map</h3><Button type="button" variant="outline" className="small-action" aria-pressed={table} onClick={() => setTable(!table)}><AppIcon icon={GridTableIcon} size="inline" />{table ? 'View timeline' : 'View as table'}</Button></div>
    <p className="quiet-note">One example of what could happen. Not a promise.</p>
    <details className="map-choices"><summary>Change the example</summary><div className="map-controls"><div><label htmlFor="map-strategy">Option</label><select id="map-strategy" value={selected} onChange={e => {onSelect(e.target.value as Strategy); onPath(0);}}>{strategyOrder.map(key => <option value={key} key={key}>{strategyNames[key]}</option>)}</select></div><div><label htmlFor="map-path">What happens in this example</label><select id="map-path" value={index} onChange={e => onPath(Number(e.target.value))} aria-describedby="map-path-description">{outcomes.map((o, i) => <option value={i} key={i}>{pathLabel(o)}</option>)}</select></div></div>
    <p id="map-path-description" className="quiet-note">{pathLabel(outcome)}</p></details>
    {table ? <Table><TableCaption>Day 0 starting reported cleared funds: {moneyText(outcome.openingBalance)}. {pathLabel(outcome)}</TableCaption><TableHeader><TableRow><TableHead>Day</TableHead><TableHead>What happens</TableHead></TableRow></TableHeader><TableBody>{outcome.events.map((event, i) => <TableRow key={i}><TableCell>Day {event.day}</TableCell><TableCell>{eventText(event)}</TableCell></TableRow>)}</TableBody></Table> : <>
      <div className="map-start"><Badge variant="secondary">Day 0</Badge><strong>{moneyText(outcome.openingBalance)}</strong><span>Money you start with</span></div>
      <ol className="timeline">{outcome.events.map((event, i) => <li key={i}><span className="timeline-node" aria-hidden="true"><AppIcon icon={event.kind === 'receipt-cleared' || event.kind === 'sales-received' ? Clock01Icon : event.kind === 'stock-purchased' ? ShoppingCart01Icon : InformationCircleIcon} size="inline" /></span><div><strong>Day {event.day}</strong><p>{eventText(event)}</p></div></li>)}</ol>
    </>}
    <details className="map-totals"><summary>Bills and costs still unpaid</summary><p>Essential bills still unpaid: {moneyText(outcome.unpaidEssential)}. Emergency costs still unpaid: {moneyText(outcome.unpaidEmergency)}. Money left after unpaid costs: {moneyText(outcome.netAfterUnpaid)}.</p><p>Payment you expect: {moneyText(snapshot.scenario.receipt.amount)} · {snapshot.draft.receiptTiming === 'unknown' ? 'the day is unknown, so it is left out' : `Day ${snapshot.draft.receiptDay}, uncertain`}. Bills due Day {snapshot.draft.dueDay}; emergency Day {snapshot.draft.emergencyDay}.</p></details>
  </section>;
}
