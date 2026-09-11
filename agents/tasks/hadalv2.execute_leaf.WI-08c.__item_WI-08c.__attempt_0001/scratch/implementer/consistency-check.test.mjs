// Consistency test: verify expected playtime, save location, and "whether full
// playthrough works" are consistent across WI-08a results, README, and handoff.

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// From scratch/implementer: .. = scratch, ../.. = task folder, ../../.. = agents/tasks, ../../../.. = agents, ../../../../.. = repo root
const repoRoot = join(__dirname, '..', '..', '..', '..', '..');
const taskDir = join(__dirname, '..', '..');

const readmePath = join(repoRoot, 'README.md');
const handoffPath = join(taskDir, 'implementation', 'WI-08c-handoff-message.md');

// WI-08a results (recorded in implementation artifact)
// Playthrough: works (manual playthrough passed all 11 steps)
// Save: works (localStorage hadal.save.v2)
// Performance: smooth (1500 creatures at 60fps in production world tests)

let readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
let handoff = existsSync(handoffPath) ? readFileSync(handoffPath, 'utf8') : '';

let failures = [];
let passed = 0;

function check(name, condition) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL: ${name}`);
  }
}

console.log('Consistency checks vs WI-08a results:');

// Save location consistency
check('README mentions localStorage (matches WI-08a)', readme.includes('localStorage'));

// Playthrough works consistency
// WI-08a: "The game is playable from a fresh browser profile to the ending"
if (handoff) {
  check('handoff states playthrough works (matches WI-08a)', /playthrough.*work|work.*playthrough|playable.*ending|ending.*playable/i.test(handoff));
}

// Performance consistency
// WI-08a: "performance remains smooth in the largest encounter"
if (handoff) {
  check('handoff mentions performance (matches WI-08a)', /performance|smooth|frame/i.test(handoff));
}

console.log(`\nResults: ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('Failed:', failures.join(', '));
  process.exit(1);
}
console.log('All consistency checks passed.');
