// README checklist test: verify each section 69 include item is present and each
// exclude item is absent. Commands must match package.json scripts.

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scratch/implementer -> task folder -> agents/tasks -> hadalv2 -> agents -> repo root
// From scratch/implementer: .. = scratch, ../.. = task folder, ../../.. = agents/tasks, ../../../.. = agents, ../../../../.. = repo root
const repoRoot = join(__dirname, '..', '..', '..', '..', '..');
const readmePath = join(repoRoot, 'README.md');
const packagePath = join(repoRoot, 'package.json');

let readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
let packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

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

console.log('README section 69 include checks:');

// Install commands
check('npm install mentioned', readme.includes('npm install'));
check('npm run dev mentioned', readme.includes('npm run dev'));

// Production build
check('npm run build mentioned', readme.includes('npm run build'));
check('npm run preview mentioned', readme.includes('npm run preview'));

// Commands match package.json
check('dev script exists in package.json', 'dev' in packageJson.scripts);
check('build script exists in package.json', 'build' in packageJson.scripts);
check('preview script exists in package.json', 'preview' in packageJson.scripts);

// Controls
check('controls documented', /controls?/i.test(readme));

// Browser requirements
check('browser requirements documented', /browser/i.test(readme));

// Expected playtime
check('expected playtime documented', /playtime|hours?|minutes?/i.test(readme));

// Save location
check('localStorage mentioned', readme.includes('localStorage'));

// Developer/debug section
check('developer or debug section', /developer|debug/i.test(readme));

console.log('\nREADME section 69 exclude checks:');

// No creature list — look for typical creature list headers
check('no creature list header', !/creature.*list|roster|bestiary/i.test(readme));

// No story synopsis beyond starting premise — the premise is "salvage diver retrieves object from deep water"
// A synopsis would have plot details, reveals, endings
check('no ending variant mentioned', !/ending.*variant|good.*ending|bad.*ending/i.test(readme));
check('no final reveal mentioned', !/final.*reveal|true.*nature|secret.*is/i.test(readme));

console.log(`\nResults: ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('Failed:', failures.join(', '));
  process.exit(1);
}
console.log('All README section 69 checks passed.');
