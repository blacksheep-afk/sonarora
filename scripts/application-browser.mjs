import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundled=resolve(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const python=process.env.SONARORAAAH_PYTHON || (existsSync(bundled)?bundled:'python');
const result=spawnSync(python,['-u','scripts/application-browser.py',process.execPath],{cwd:root,stdio:'inherit',env:{...process.env,PYTHONPATH:[resolve(root,'.python-deps'),process.env.PYTHONPATH].filter(Boolean).join(delimiter)},windowsHide:true,timeout:180000});
if(result.error)console.error(result.error.message);
if(result.error||result.status!==0){console.error('Application browser gate failed. Requires Python, pinned Playwright and an installed Edge or Playwright Chromium browser.');process.exit(1);}