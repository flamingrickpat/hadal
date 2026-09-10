// Reviewer probe: independent spoiler scan of the full git history.
// Question: does any ST-03 commit (subject or body) carry a name/secret token?
// Deliberately a superset of the test's filter: case-insensitive ST-03/WI-03[a-d]
// matching, whole-word + case-insensitive token matching, so it catches
// anything the test's case-sensitive commit filter could skip.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('C:/Temp/hadal-v2/design_private/_spoiler_tokens.txt', 'utf8')
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

const log = execFileSync('git', ['-C', 'C:/Temp/hadal-v2', 'log', '--format=%x01%H%x09%s%x09%b'], { encoding: 'utf8' });
let total = 0, st03 = 0, offenders = 0;
const missedByTestFilter = [];
for (const entry of log.split('\x01')) {
  const lines = entry.split(/\r?\n/);
  if (!lines[0]) continue;
  const full = lines.join('\n');
  total += 1;
  const isSt03 = /st-03|wi-03[a-d]/i.test(full);
  if (!isSt03) continue;
  st03 += 1;
  if (!/ST-03|WI-03[a-d]/.test(full)) missedByTestFilter.push(lines[0].slice(0, 80));
  const token = hit(full);
  if (token) { offenders += 1; console.log('  OFFENDER: ' + lines[0].slice(0, 80) + ' :: ' + token); }
}
console.log(`total commits: ${total}; ST-03-related (case-insensitive): ${st03}; offender hits: ${offenders}`);
if (missedByTestFilter.length) {
  console.log('commits the test\'s case-sensitive filter would MISS:');
  for (const c of missedByTestFilter) console.log('  ' + c);
}
console.log(offenders === 0 ? 'PROBE PASS (commit history clean)' : 'PROBE FAIL');
process.exit(offenders === 0 ? 0 : 1);
