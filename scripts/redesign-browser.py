"""Redesign interaction evidence and five-screen captures. Requires a running local app.

PYTHONPATH=.python-deps PLAYWRIGHT_BROWSERS_PATH=.browser-cache python3 scripts/redesign-browser.py
Optional: SONARORAAAH_ORIGIN and SONARORAAAH_BROWSER (default chromium).
All delays below belong to the test harness, never the application.
"""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
OUTPUT=ROOT/'test-results'/'redesign'
OUTPUT.mkdir(parents=True,exist_ok=True)
(OUTPUT/'results.json').write_text(json.dumps({'status':'running'})+'\n')
ORIGIN=os.environ.get('SONARORAAAH_ORIGIN','http://127.0.0.1:5173')
FAMILY=os.environ.get('SONARORAAAH_BROWSER','chromium')
checks=[]
def check(value,name):
    if not value:
        raise AssertionError(name)
    checks.append(name)
    print('PASS '+name,flush=True)

with sync_playwright() as playwright:
    browser=getattr(playwright,FAMILY).launch(headless=True)
    for width in [360,1280]:
        page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1,reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        held=[]
        entry=re.compile(r'(?:/src/main\.tsx|/assets/index-[^/]+\.js)(?:\?.*)?$')
        page.route(entry,lambda route:held.append(route))
        page.goto(ORIGIN,wait_until='commit')
        page.locator('.boot-loading').wait_for()
        page.screenshot(path=str(OUTPUT/f'01-loading-{width}.png'))
        check(page.locator('.boot-loading').get_attribute('aria-busy')=='true',f'{width}: startup announces busy state')
        for route in held:
            route.continue_()
        page.unroute(entry)
        page.get_by_role('heading',name='Sonarora',exact=True).wait_for()
        check(page.locator('#cash').input_value()=='',f'{width}: startup has no invented financial entries')
        page.locator('#inputs').get_by_role('button',name='Use example',exact=True).click()
        page.locator('.result-highlight').wait_for()
        page.evaluate('document.fonts.ready')
        check('are tied' in page.locator('.result-highlight').inner_text(),f'{width}: equal engine risks are described as a tie')
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}: home fits viewport')
        page.screenshot(path=str(OUTPUT/f'02-home-{width}.png'),full_page=True)
        page.screenshot(path=str(OUTPUT/f'02-home-{width}-viewport.png'))
        if width==1280:
            dimensions=page.evaluate('({height:document.documentElement.scrollHeight,viewport:innerHeight})')
            check(dimensions['height']<=dimensions['viewport'],f'{width}: main money view fits one desktop screen ({dimensions})')
        # Table and legend views must expose the same engine percentages.
        page.locator('.result-panel').get_by_role('button',name='View as table',exact=True).first.click()
        check('6.25%' in page.locator('.result-panel table').inner_text(),f'{width}: risk table retains engine percentage')
        page.locator('.result-panel').get_by_role('button',name='View chart',exact=True).click()
        page.locator('.strategy-legend').get_by_role('button',name='Wait until after bill day 0%',exact=True).click()
        check(page.locator('.result-panel .donut-label strong').inner_text()=='0%',f'{width}: clickable legend updates the individual risk ring')
        check(page.locator('.result-panel .money-map').count()==0,f'{width}: Money Map is absent from Your money')
        page.get_by_role('link',name='Compare options',exact=True).click()
        page.locator('[data-strategy=trigger]').wait_for()
        page.locator('.comparison-map > summary').click()
        page.locator('.money-map').get_by_role('button',name='View as table',exact=True).click()
        check('Day 30' in page.locator('.money-map table').inner_text(),f'{width}: Money Map table includes closing event')
        page.locator('.money-map').get_by_role('button',name='View timeline',exact=True).click()
        page.locator('.comparison-map > summary').click()
        page.evaluate('window.scrollTo(0,0)')
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}: comparison fits viewport')
        if width==1280:
            check(page.locator('[data-strategy]').evaluate_all('nodes=>nodes.every(node=>node.getBoundingClientRect().bottom<=innerHeight)'),f'{width}: all three compact cards fit in the first screen')
        page.screenshot(path=str(OUTPUT/f'03-compare-{width}.png'),full_page=True)
        page.get_by_role('tab',name='List',exact=True).click()
        check(page.locator('#comparison table').first.locator('tbody tr').count()==3,f'{width}: comparison table contains all strategies')
        page.get_by_role('tab',name='Cards',exact=True).click()
        page.get_by_role('link',name='Check a purchase',exact=True).click()
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}: purchase plan fits viewport')
        page.screenshot(path=str(OUTPUT/f'04-purchase-{width}.png'),full_page=True)
        page.get_by_role('button',name='I understand and want to continue',exact=True).click()
        check(page.locator('#splitAcceptance').is_visible(),f'{width}: continue reveals supplier inputs without a transaction')
        page.get_by_role('link',name='Your money',exact=True).click()
        if page.locator('[data-slot=collapsible-trigger]').get_attribute('aria-expanded')=='false':
            page.locator('[data-slot=collapsible-trigger]').click()
        page.locator('#notes').fill('Invented example for review. These notes do not affect the model.')
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}: expanded details fit viewport')
        page.screenshot(path=str(OUTPUT/f'05-details-{width}.png'),full_page=True)
        page.locator('#cash').fill('601')
        check(page.locator('.result-highlight').count()==0 and 'Inputs changed, compare again' in page.locator('.result-panel').inner_text(),f'{width}: financial edit clears visible result immediately')
        page.get_by_role('button',name='Clear all',exact=True).click()
        check(page.locator('#notes').input_value()=='' and page.locator('#cash').input_value()=='',f'{width}: clear removes optional notes and financial entries')
        # Make only zero-delay callbacks slow to observe real pending UI. This is test-only.
        page.evaluate("""() => {
            const schedule=window.setTimeout.bind(window);
            window.setTimeout=(callback,delay,...args)=>schedule(callback,delay===0?2500:delay,...args);
        }""")
        page.locator('#inputs').get_by_role('button',name='Use example',exact=True).click()
        loading=page.locator('.loading-state-compact:visible')
        loading.wait_for()
        check(loading.count()==1 and loading.get_by_role('progressbar',name='Loading Sonarora').count()==1,f'{width}: comparison has one calm named progress indicator')
        loading.screenshot(path=str(OUTPUT/f'loading-comparison-{width}.png'))
        page.locator('.result-highlight').wait_for()
        page.get_by_role('link',name='Check a purchase',exact=True).click()
        if not page.locator('.staged-checkpoint').is_visible():
            page.get_by_role('button',name='I understand and want to continue',exact=True).click()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        loading.wait_for()
        check(loading.count()==1 and loading.inner_text()=='Sonarora\nLoading…',f'{width}: staged checks reuse the identical loading language')
        loading.scroll_into_view_if_needed()
        loading.screenshot(path=str(OUTPUT/f'loading-purchase-{width}.png'))
        page.screenshot(path=str(OUTPUT/f'loading-purchase-context-{width}.png'))
        page.get_by_role('heading',name='Next purchase: wait',exact=True).wait_for()
        check(not errors,f'{width}: no browser exceptions')
        page.close()
    browser.close()
(OUTPUT/'results.json').write_text(json.dumps({'status':'passed','family':FAMILY,'checks':checks,'count':len(checks),'viewports':[360,1280]},indent=2)+'\n')
print(f'{len(checks)}/{len(checks)} redesign checks passed',flush=True)
