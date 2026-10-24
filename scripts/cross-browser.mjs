import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'test-results');
mkdirSync(output,{recursive:true});
const results=[];
for(const family of ['firefox','webkit']) {
 console.log('\nCross-browser: '+family);
 const run=spawnSync(process.execPath,['scripts/application-browser.mjs'],{
  cwd:root,stdio:'inherit',windowsHide:true,
  env:{...process.env,SONARORAAAH_BROWSER:family,
   PLAYWRIGHT_BROWSERS_PATH:resolve(root,'.browser-cache')}});
 let evidence=null;
 try{evidence=JSON.parse(readFileSync(resolve(output,'application-'+family,'results.json'),'utf8'));}
 catch{ /* A missing result is explicitly a failure, never a pass. */ }
 results.push({family,exitCode:run.status,error:run.error?.message??null,evidence});
}
writeFileSync(resolve(output,'cross-browser.json'),JSON.stringify(results,null,2)+'\n');
if(results.some(r=>r.error||r.exitCode!==0||r.evidence?.status!=='passed'))process.exit(1);
console.log('PASS: Firefox and WebKit both executed the built application successfully.');
