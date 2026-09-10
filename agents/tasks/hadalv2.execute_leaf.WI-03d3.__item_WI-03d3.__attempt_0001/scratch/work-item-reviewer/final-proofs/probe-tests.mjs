// Reviewer probe: per-species signature-rule scenario content check.
// Question: for each of the 22 roster ids, does a scenario file carry a
// per-species describe block that actually contains it() cases (a headless
// signature-rule test, not an empty shell)? Independent of the shipped
// test, which only checks that the id appears on some describe line.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = 'C:/Temp/hadal-v2';
// Roster ids = the def ids in the secret roster file (the source of truth for
// "every implemented major species").
const defSrc = readFileSync(root + '/src/content/secret/hiddenCreatures.ts', 'utf8');
const ids = [...defSrc.matchAll(/^\s*id: '(T-\d+)',/gm)].map((m) => m[1]);
// Deduplicate keeping order (the def ids in the secret roster file).
const roster = [...new Set(ids)];
console.log('roster ids (' + roster.length + '): ' + roster.join(', '));

const files = [
  'src/sim/tier1Scenario.test.ts',
  'src/sim/tier2Scenario.test.ts',
  'src/sim/tier3Scenario.test.ts',
  'src/sim/tier4Scenario.test.ts',
  'src/sim/creatureScenario.test.ts',
  'src/sim/ecologyScenario.test.ts',
];
let fail = 0;
for (const id of roster) {
  const re = new RegExp(`\\b${id}\\b`);
  let best = null; // { file, its }
  for (const f of files) {
    const lines = readFileSync(root + '/' + f, 'utf8').split(/\r?\n/);
    // find a describe line naming the id, then count it( blocks until the
    // describe closes (indent-based: lines dedented to <= describe indent).
    for (let i = 0; i < lines.length; i += 1) {
      const l = lines[i];
      if (!l.trimStart().startsWith('describe(') || !re.test(l)) continue;
      const indent = l.match(/^\s*/)[0].length;
      let its = 0;
      for (let j = i + 1; j < lines.length; j += 1) {
        const line = lines[j];
        if (!line.trim()) continue;
        const ind = line.match(/^\s*/)[0].length;
        if (ind <= indent) break; // block closed
        if (/^\s*it\(/.test(line)) its += 1;
      }
      if (!best || its > best.its) best = { file: f.split('/').pop(), its };
    }
  }
  if (!best || best.its === 0) { fail += 1; console.log(`  FAIL: ${id} has no non-empty scenario block`); }
  else console.log(`  ok: ${id} -> ${best.file} (${best.its} cases)`);
}
console.log(fail === 0 ? 'PROBE PASS' : `PROBE FAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
