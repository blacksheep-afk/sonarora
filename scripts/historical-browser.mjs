import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundled=resolve(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const python=process.env.SONARORAAAH_PYTHON||(existsSync(bundled)?bundled:'python');
const result=spawnSync(python,['-u','reference/R51/evidence/r51_release_gate_check.py'],{
 cwd:root,stdio:'inherit',windowsHide:true,timeout:180000,
 env:{...process.env,PYTHONPATH:[resolve(root,'.python-deps'),process.env.PYTHONPATH].filter(Boolean).join(delimiter)}});
if(result.error)console.error(result.error.message);
if(result.error||result.status!==0){console.error('Historical R51 browser gate failed; see preceding diagnostics.');process.exit(1);}
