"""Real built application tests. No historical reference is modified or served here."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request
from urllib.parse import urlsplit
from hardening_browser import run_hardening
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FAMILY = os.environ.get('SONARORAAAH_BROWSER','chromium')
OUTPUT = ROOT / 'test-results' / ('application' if FAMILY=='chromium' else 'application-'+FAMILY)
OUTPUT.mkdir(parents=True, exist_ok=True)
checks = []
(OUTPUT/'results.json').write_text(json.dumps({'status':'running','family':FAMILY}),encoding='utf-8')
def check(condition, name):
    if not condition:
        detail={'assertion':name}
        if globals().get('page') is not None:
            try:
                detail['activeElement']=page.evaluate("({tag:document.activeElement.tagName,id:document.activeElement.id,text:document.activeElement.textContent})")
                page.screenshot(path=str(OUTPUT/'failure.png'),full_page=False)
            except Exception as capture_error:
                detail['captureError']=str(capture_error)
        (OUTPUT/'failure-detail.json').write_text(json.dumps(detail,indent=2),encoding='utf-8')
        raise AssertionError(name)
    checks.append(name)
    print('PASS ' + name, flush=True)

with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
origin = 'http://127.0.0.1:' + str(port)
flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
server_log = open(OUTPUT / 'server.log', 'w', encoding='utf-8')
server = subprocess.Popen([sys.argv[1], 'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', str(port), '--strictPort'], cwd=ROOT, stdout=server_log, stderr=subprocess.STDOUT, creationflags=flags)
browser = None
try:
    for _ in range(100):
        try:
            urllib.request.urlopen(origin, timeout=1).close()
            break
        except OSError:
            if server.poll() is not None:
                raise RuntimeError('Production preview exited: ' + str(server.returncode))
            time.sleep(.1)
    else:
        raise RuntimeError('Production preview did not become ready')
    with sync_playwright() as pw:
        if FAMILY in ['firefox','webkit']:
            browser=getattr(pw,FAMILY).launch(headless=True)
        elif FAMILY!='chromium':
            raise RuntimeError('Unsupported browser family: '+FAMILY)
        launch_errors = []
        for channel in (['msedge', None] if FAMILY=='chromium' else []):
            try:
                browser = pw.chromium.launch(headless=True, **({'channel': channel} if channel else {}))
                break
            except Exception as error:
                launch_errors.append(str(error))
        if browser is None:
            raise RuntimeError('No approved Playwright browser available: ' + '\n'.join(launch_errors))
        browser_version=browser.version
        page = browser.new_page(viewport={'width':1280,'height':900})
        errors = []
        external = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: external.append(request.url) if urlsplit(request.url).netloc!=urlsplit(origin).netloc and not request.url.startswith('data:') else None)
        page.goto(origin)
        page.get_by_role('heading', name='Sonarora', exact=True).wait_for()
        check(page.locator('[data-strategy]').count() == 0, 'Blank session contains no financial outputs')
        page.keyboard.press('Tab')
        check(page.evaluate('document.activeElement.getAttribute("href")') == '#inputs', 'Keyboard reaches first workflow link')
        page.keyboard.press('Tab')
        check(page.evaluate('document.activeElement.getAttribute("href")') == '#comparison', 'Keyboard follows logical workflow order')
        def close_more_details():
            dialog=page.get_by_role('dialog',name='More details',exact=True)
            if dialog.is_visible():
                dialog.get_by_role('button',name='Done',exact=True).click()
        def go_inputs():
            close_more_details()
            if not page.locator('#inputs').is_visible():
                page.get_by_role('link',name='Your money',exact=True).click()
        def go_staged():
            close_more_details()
            if not page.locator('#safe-to-buy').is_visible():
                page.get_by_role('link',name='Check a purchase',exact=True).click()
            if not page.locator('.staged-checkpoint').is_visible():
                page.get_by_role('button',name='I understand and want to continue',exact=True).click()
        def open_details():
            page.locator('details').evaluate_all('(nodes)=>nodes.forEach(n=>n.open=true)')
        def example():
            go_inputs()
            page.get_by_role('button',name='Use example',exact=True).first.click()
            page.locator('.result-highlight').wait_for()
            open_details()
        def fill(values):
            extra={'bill2','receiptTiming','billPriority','grossSales','salesLagDays','salesProbability','relation','emergencyAmount','emergencyDay'}
            main={'cash','bank','receivable','receiptDay','bill1','dueDay','stockCost','receiptProbability'}
            for key,value in values.items():
                if key in extra:
                    if not page.get_by_role('dialog',name='More details',exact=True).is_visible():
                        go_inputs()
                        page.get_by_role('button',name='More details',exact=True).click()
                elif key in main:
                    go_inputs()
                else:
                    go_staged()
                    open_details()
                node=page.locator('#'+key)
                if node.evaluate('n=>n.tagName')=='SELECT':
                    node.select_option(value)
                else:
                    node.fill(value)
            close_more_details()
        def compare():
            go_inputs()
            page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
            page.locator('[data-strategy=trigger]').wait_for()
            open_details()
        page.locator('[data-slot=dialog-trigger]').focus()
        page.keyboard.press('Enter')
        check(page.get_by_role('dialog',name='More details',exact=True).is_visible(),'Keyboard Enter opens More details dialog')
        page.keyboard.press('Escape')
        page.wait_for_function("document.querySelector('[data-slot=dialog-trigger]')===document.activeElement")
        check(page.locator('[data-slot=dialog-trigger]').evaluate('n=>n===document.activeElement'),'Escape closes dialog and restores trigger focus')
        example()
        compare()
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'No horizontal overflow at 1280px')
        check(page.locator('[data-strategy]').count()==3, 'Valid form renders all three approved strategy results')
        check('R' in page.locator('[data-strategy=now]').inner_text(), 'Strategy amounts are displayed as rand from engine cents')
        check('calculated examples' in page.locator('#comparison').inner_text().lower(), 'Results clearly labelled calculated examples')
        check('not financial advice' in page.locator('#comparison').inner_text().lower(), 'Results disclose not financial advice')
        check('Day 0' in page.locator('.money-map').inner_text() and 'Day 30' in page.locator('.money-map').inner_text(), 'Money Map includes Day 0 and Day 30 closure')
        page.screenshot(path=str(OUTPUT/'desktop.png'),full_page=True)
        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':844})
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No horizontal overflow at '+str(width)+'px')
        page.screenshot(path=str(OUTPUT/'mobile.png'),full_page=True)
        page.set_viewport_size({'width':1280,'height':900})
        fill({'cash':'0.001'})
        check(page.locator('[data-strategy]').count()==0,'Financial edit immediately removes all comparison cards')
        page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
        page.locator('#cash[aria-invalid=true]').wait_for()
        check(page.locator('#cash-error').inner_text().startswith('Use at most two'), 'Fractional-cent error is field level')
        check(page.evaluate('document.activeElement.id')=='cash','Validation moves keyboard focus to first invalid field')
        check('cash-error' in page.locator('#cash').get_attribute('aria-describedby').split(),'Invalid field references its error')
        check(page.locator('[role=alert]').count()>0,'Validation summary is announced')
        example()
        fill({'cash':'0.01','receivable':'0','bill1':'0.02','stockCost':'0','grossSales':'0','receiptProbability':'0','salesProbability':'0'})
        compare()
        check('R0.01' in page.locator('[data-strategy=wait]').inner_text(),'One-cent unpaid obligation survives actual UI submission')
        example()
        fill({'receiptTiming':'unknown','relation':'linked'})
        compare()
        check('0%' in page.locator('[data-strategy=trigger]').inner_text(),'Unknown-date linked model does not invent conditional purchase')
        check('payment date is unknown' in page.locator('#comparison').inner_text().lower(),'Unknown date exclusion explained')
        example()
        fill({'cash':'100','receivable':'100','receiptDay':'14','bill1':'100','bill2':'100','dueDay':'14','billPriority':'second','stockCost':'0.01','grossSales':'1','salesLagDays':'14','receiptProbability':'1','salesProbability':'1'})
        compare()
        text=page.locator('.money-map').inner_text()
        check(text.index('bill-2:')<text.index('bill-1:'),'Same-day Money Map follows selected bill priority')
        check('unpaid R0.01' in text,'Priority leaves the correct one-cent bill shortfall visible')
        fill({'cash':'300','stockCost':'1'})
        compare()
        page.get_by_label('Option',exact=True).select_option('wait')
        text=page.locator('.money-map').inner_text()
        check('Day 15' in text and 'Day 29' in text and 'Day 30' in text,'Actual app shows wait Day 15, sales Day 29, closure Day 30')
        example()
        fill({'cash':'0','receivable':'600','receiptDay':'4','dueDay':'3','receiptProbability':'1','salesProbability':'1'})
        compare()
        check('R500.00' in page.locator('[data-strategy=wait]').inner_text(),'Wait strategy retains R500 unpaid essential obligation')
        page.get_by_label('Option',exact=True).select_option('wait')
        check('Stock bought' in page.locator('.money-map').inner_text(),'Wait may buy with prior unpaid bills; UI does not conceal it')
        example()
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='Next purchase: wait',exact=True).wait_for()
        check(True,'Later purchase locked without current reports')
        for kind in ['receipt','balance','liabilities']:
            page.get_by_role('checkbox',name={'receipt':'I confirm the payment I entered. Sonarora has not checked it.','balance':'I confirm the balance I entered. Sonarora has not checked it.','liabilities':'I confirm the bills paid and money still owed. Sonarora has not checked this.'}[kind],exact=True).check()
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='Next purchase: fits these numbers',exact=True).wait_for()
        check('R200.00' in page.get_by_test_id('safe-result').inner_text(),'Partial payment retains R200 reserve')
        check('R350.00' in page.get_by_test_id('safe-result').inner_text(),'Refreshed balance stays R350 without receipt double count')
        fill({'clearedBalance':'349.99'})
        check(page.get_by_role('checkbox',checked=True).count()==0,'Financial edit immediately invalidates all confirmations')
        check('Next purchase:' not in page.get_by_test_id('safe-result').inner_text(),'Staged result immediately disappears after edit')
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='Next purchase: wait',exact=True).wait_for()
        check(True,'One-cent shortage and stale reports keep later batch locked')
        for kind in ['receipt','balance','liabilities']:
            page.get_by_role('checkbox',name={'receipt':'I confirm the payment I entered. Sonarora has not checked it.','balance':'I confirm the balance I entered. Sonarora has not checked it.','liabilities':'I confirm the bills paid and money still owed. Sonarora has not checked this.'}[kind],exact=True).check()
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='Next purchase: wait',exact=True).wait_for()
        check(True,'One-cent shortage blocks later batch even with fresh confirmations')
        fill({'bill1Outstanding':'199.99'})
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.locator('[role=alert]').wait_for()
        check('Some details do not match. Check your payment, balance and bills still to pay.' in page.locator('[role=alert]').inner_text(),'Contradictory partial payment rejected')
        example()
        fill({'splitAcceptance':'not-accepted'})
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='This purchase does not fit yet',exact=True).wait_for()
        check(True,'Supplier refusal produces blocked state')
        go_inputs()
        page.get_by_role('button',name='Clear all',exact=True).click()
        check(page.locator('#cash').input_value()=='' and page.locator('[data-strategy]').count()==0,'New decision session clears financial data and outputs')
        check(page.get_by_role('checkbox',checked=True).count()==0,'New decision session clears confirmations')
        check(page.locator('input:not([type=checkbox]), select').evaluate_all('(nodes)=>nodes.every(n=>n.labels.length>0)'),'Every input and select has an accessible native label')
        example()
        page.evaluate("""async () => {
            [...document.querySelectorAll('button')].find(b=>b.textContent==='Compare options').click();
            [...document.querySelectorAll('button')].find(b=>b.textContent==='Clear all').click();
            await new Promise(resolve=>setTimeout(resolve,5100));
        }""")
        check(page.locator('[data-strategy]').count()==0 and page.locator('#cash').input_value()=='','Delayed comparison cannot populate a new decision session')
        hardening=run_hardening(page,check,OUTPUT,ROOT)
        check(not external,'Application makes no external network requests')
        check(not errors,'No application browser exceptions')
        browser.close()
        browser=None
    (OUTPUT/'results.json').write_text(json.dumps({'status':'passed','family':FAMILY,'browserVersion':browser_version,'passed':len(checks),'baselineAssertions':41,'hardeningAssertions':len(checks)-41,'checks':checks,'hardening':hardening,'viewports':[1280,390,320],'screenshots':['desktop.png','mobile.png','hardened-desktop.png','hardened-mobile.png']},indent=2),encoding='utf-8')
    print(str(len(checks))+'/'+str(len(checks))+' application browser checks passed',flush=True)
except BaseException as error:
    (OUTPUT/'results.json').write_text(json.dumps({'status':'failed','family':FAMILY,'browserVersion':locals().get('browser_version'),'passedBeforeFailure':len(checks),'error':str(error)},indent=2),encoding='utf-8')
    raise
finally:
    if browser is not None:
        try:
            browser.close()
        except Exception:
            pass
    server.terminate()
    try:
        server.wait(timeout=10)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait(timeout=10)
    server_log.close()