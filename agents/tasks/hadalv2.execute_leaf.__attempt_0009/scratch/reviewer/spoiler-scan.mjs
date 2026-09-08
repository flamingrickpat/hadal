// WI-03a review probe: case-sensitive word-boundary scan for the private
// roster's creature names (spoiler tokens) across public product source.
// A word match in src/ or index.html is a spoiler-rule violation
// (request §0/§12/§68: names live only in design_private/ and debug
// internals); the generic behavior word "flock"/"Flock" must NOT match
// the T-01 name "Floc".
import fs from 'node:fs';
import path from 'node:path';

const toks = ['Floc', 'Spore-silk', 'Lantern-raft', 'Drapery', 'Pulse-motes', 'Markers',
  'relieved grief', 'quiet horror', 'hatches grown over'];
const roots = ['src', 'tests'];
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|js|html|json)$/.test(e.name)) files.push(p);
  }
}
for (const r of roots) if (fs.existsSync(r)) walk(r);
if (fs.existsSync('index.html')) files.push('index.html');

const hits = [];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  for (const t of toks) {
    // escape regex metacharacters, keep '-' literal; require a non-letter
    // boundary on both sides so "Flock" does not match "Floc".
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`);
    if (re.test(c)) hits.push(`${f}: '${t}'`);
  }
}
console.log(hits.length ? hits.join('\n') : 'word-boundary scan: clean');
