import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Pin trusted expectations outside the editable manifest as well.
const expected = {
  'index.html': 'ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d',
  'MOYA_R51_PORTABLE_EVIDENCE_FIXED_WINDOWS.zip': '79ddd49c3a4f7962af497b92c23fb0b810a17076dc925d8f028efd9c6a2f36fe',
  'evidence/index.html': 'ac4158d3ab0fe4c4f4602c1f9c1a6045b19eecd29f4f9511c5c2ac5889793f3d',
};
let failed = false;
for (const [file, hash] of Object.entries(expected)) {
  try {
    const bytes = readFileSync(new URL(`../reference/R51/${file}`, import.meta.url));
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== hash) throw new Error(`SHA-256 mismatch: ${actual}`);
    console.log(`PASS R51 ${file}: ${actual}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL R51 ${file}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
