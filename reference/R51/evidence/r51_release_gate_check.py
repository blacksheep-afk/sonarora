from pathlib import Path
import os
import shutil
from playwright.sync_api import sync_playwright
import json,hashlib,sys
ROOT=Path(__file__).resolve().parent
src=(ROOT/'index.html').read_text(encoding='utf-8')
expected='ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d'
actual=hashlib.sha256(src.encode('utf-8')).hexdigest()
if actual!=expected: raise SystemExit(f'R51 SHA mismatch: {actual} != {expected}')
print('R51 SHA256 verified:',actual)

results=[]
def record(name,ok,detail=''):
 results.append((name,bool(ok),detail));print(('PASS' if ok else 'FAIL'),name,detail)
with sync_playwright() as p:
 browser=None
 for kwargs in [{'executable_path':os.environ['MOYA_CHROMIUM']} ] if os.environ.get('MOYA_CHROMIUM') else []:
  try: browser=p.chromium.launch(headless=True,args=['--disable-gpu'],**kwargs); break
  except Exception as exc: print('Custom Chromium unavailable:',str(exc)[:160])
 if browser is None:
  for kwargs in ({'channel':'msedge'}, {'channel':'chrome'}, {}):
   try: browser=p.chromium.launch(headless=True,args=['--disable-gpu'],**kwargs); print('Browser launch:',kwargs); break
   except Exception as exc: print('Browser attempt unavailable:',str(exc)[:160])
 if browser is None:
  for candidate in ['/usr/bin/chromium','/usr/bin/google-chrome']:
   if Path(candidate).exists():
    try: browser=p.chromium.launch(headless=True,executable_path=candidate,args=['--no-sandbox','--disable-gpu']); break
    except Exception: pass
 if browser is None: raise RuntimeError('No supported Chromium/Edge browser available. Install Playwright Chromium via: python -m playwright install chromium')
 for width in [1280,390]:
  page=browser.new_page(viewport={'width':width,'height':900}); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)));page.set_content(src)
  page.locator('#safeToBuyPanel summary').click()
  record(f'{width} no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  page.locator('#splitAccepted').select_option('yes');page.locator('#obligationStatus1').select_option('partial');page.locator('#paidAmount1').fill('300')
  page.locator('#clearedAmount').fill('300');page.locator('#clearedDay').fill('1');page.locator('#currentFunds').fill('350');
  for id in ['liabilitiesConfirmed','receiptConfirmed','balanceConfirmed']:page.locator('#'+id).check()
  page.locator('#checkSafeToBuy').click();txt=page.locator('#safeToBuyResult').inner_text()
  record(f'{width} partial R300 exact unlock', 'fits this entered snapshot' in txt,txt[-200:])
  page.locator('#paidAmount1').fill('299.99');txt=page.locator('#safeToBuyResult').inner_text()
  record(f'{width} input invalidates and clears confirmations', 'Inputs changed' in txt and all(not page.locator('#'+id).is_checked() for id in ['liabilitiesConfirmed','receiptConfirmed','balanceConfirmed']))
  for id in ['liabilitiesConfirmed','receiptConfirmed','balanceConfirmed']:page.locator('#'+id).check()
  page.locator('#checkSafeToBuy').click();txt=page.locator('#safeToBuyResult').inner_text()
  record(f'{width} one-cent reserve short locks','stays locked' in txt,txt[-220:])
  page.locator('#obligationStatus1').select_option('unresolved');page.locator('#checkSafeToBuy').click();txt=page.locator('#safeToBuyResult').inner_text()
  record(f'{width} unresolved locks','stays locked' in txt)
  page.locator('#obligationStatus1').select_option('paid');page.locator('#paidAmount1').fill('0');page.locator('#currentFunds').fill('150')
  for id in ['liabilitiesConfirmed','receiptConfirmed','balanceConfirmed']:page.locator('#'+id).check()
  page.locator('#checkSafeToBuy').click();txt=page.locator('#safeToBuyResult').inner_text()
  record(f'{width} reported paid bill permits exact purchase','fits this entered snapshot' in txt)
  page.locator('#secondDeliveryFee').fill('0.001');page.locator('#checkSafeToBuy').click();txt=page.locator('#safeToBuyResult').inner_text();record(f'{width} fractional fee blocks', 'No staged-order option shown' in txt or 'decimal' in txt.lower() or 'whole cent' in txt.lower(),txt[:150])
  record(f'{width} js no errors',len(errors)==0,str(errors))
  unlabeled=page.evaluate("() => [...document.querySelectorAll('input,select,button')].filter(e => !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.textContent.trim()).map(e=>e.id||e.outerHTML.slice(0,60))")
  record(f'{width} controls labeled',not unlabeled,str(unlabeled))
  page.close()
 browser.close()
# Diagnostic flag only: forces an assertion failure for runner verification.
# Never use this mode to assess candidate readiness.
if '--self-test-fail' in sys.argv:
 record('TEST HARNESS NEGATIVE CONTROL (intentionally failed)',False,'intentional failure')
passed=sum(x[1] for x in results)
print('TOTAL',passed,'/',len(results))
if passed!=len(results):
 print('BROWSER GATE: FAIL')
 sys.exit(1)
print('BROWSER GATE: PASS')
sys.exit(0)
