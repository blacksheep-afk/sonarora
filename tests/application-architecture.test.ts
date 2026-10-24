import { describe,it,expect } from 'vitest';
import { inspectApplication } from '../scripts/application-policy';
describe('application dependency boundaries',()=>{
 it('allows React to consume only the application boundary',()=>{expect(inspectApplication('App.tsx',"import {compareDraft} from './application/adapter';")).toEqual([]);});
 it.each(["import {compareScenario} from './engine/comparison/index';","type T=import('./engine/money/index').Cents;","export * from './engine/safe-to-buy/index';","import('./application/adapter');","fetch('/bank');","localStorage.setItem('cash','1');"])( 'rejects UI bypass %s',code=>{expect(inspectApplication('App.tsx',code).length).toBeGreaterThan(0);});
 it.each(["import React from 'react';","import {x} from '../App';","document.querySelector('input');","process.env;","import {x} from 'node:fs';"])( 'rejects adapter capability %s',code=>{expect(inspectApplication('application/adapter.ts',code).length).toBeGreaterThan(0);});
 it('rejects unregistered source modules',()=>{expect(inspectApplication('extra.ts','').length).toBeGreaterThan(0);});
});