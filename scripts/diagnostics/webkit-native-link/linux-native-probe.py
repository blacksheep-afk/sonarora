"""Portable native-link probe for an already provisioned Linux Playwright environment.
No installation, private flags, browser modifications or app dependency.
Usage: python linux-native-probe.py [path/to/native.html]
"""
import importlib.metadata,json,platform,sys,threading
from pathlib import Path
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from playwright.sync_api import sync_playwright
fixture=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('native.html')
content=fixture.read_bytes()
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(content)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
result={'environment':platform.platform(),'python':sys.version,'playwright':importlib.metadata.version('playwright'),'headless':True,'sequence':[]}
try:
 with sync_playwright() as pw:
  browser=pw.webkit.launch(headless=True)
  result['browserVersion']=browser.version
  page=browser.new_page(viewport={'width':1280,'height':900})
  page.goto('http://127.0.0.1:'+str(server.server_address[1]))
  for i in range(8):
   page.keyboard.press('Tab')
   page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   result['sequence'].append(page.evaluate('()=>({tag:document.activeElement.tagName,text:document.activeElement===document.body?"":document.activeElement.textContent,hasFocus:document.hasFocus()})'))
  browser.close()
 result['status']='executed'
except Exception as error:
 result.update(status='blocked',error=str(error))
finally:
 server.shutdown();server.server_close()
 print(json.dumps(result,indent=2))
if result['status']!='executed':sys.exit(1)
