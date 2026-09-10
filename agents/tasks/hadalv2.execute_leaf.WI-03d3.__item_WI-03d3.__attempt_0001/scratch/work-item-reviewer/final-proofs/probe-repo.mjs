// Reviewer probe: whole-repo product token scan across ALL file types.
// Question: does any product file (any extension) outside the allowed homes
// carry a name/secret token? The shipped test scans only src/**/*.ts; this
// covers index.html, *.mjs/*.js/*.json/*.css configs, and the tests/ dir too.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const root = 'C:/Temp/hadal-v2';
const tokens = readFileSync(root + '/design_private/_spoiler_tokens.txt', 'utf8')
  .split(/\r?\n/).map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith('#'))
  .filter((l) => !/^T-\d\d$/.test(l))
  .map((l) => l.replace(/^The\s+/, ''))
  .filter((l) => l.length >= 3);
const matchers = tokens.map((t) =>
  new RegExp(`\\b${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
const hit = (text) => {
  const low = text.toLowerCase();
  return tokens.find((t, i) => matchers[i].test(low));
};

// git-tracked files only (the shippable product), minus the allowed homes.
const files = execFileSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => !f.startsWith('design_private/'))
  .filter((f) => !f.startsWith('agents/'));
let offenders = 0, scanned = 0;
for (const f of files) {
  const p = root + '/' + f;
  let size = 0;
  try { size = statSync(p).size; } catch { continue; }
  if (size > 3_000_000) continue;
  scanned += 1;
  let text;
  try { text = readFileSync(p, 'utf8'); } catch { continue; } // binary
  const token = hit(text);
  if (token) { offenders += 1; console.log(`  OFFENDER: ${f} :: ${token}`); }
}
console.log(`files scanned: ${scanned}; offenders: ${offenders}`);
console.log(offenders === 0 ? 'PROBE PASS (all git-tracked product files clean)' : 'PROBE FAIL');
process.exit(offenders === 0 ? 0 : 1);
