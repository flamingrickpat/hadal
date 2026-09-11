// Handoff message checklist test: verify it covers the five section 68 fields
// and contains no deep-creature names/descriptions, lore truth, MacGuffin truth,
// final-encounter mechanics, ending variants, or late-zone visuals.

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// From scratch/implementer: .. = scratch, ../.. = task folder
const taskDir = join(__dirname, '..', '..');
const handoffPath = join(taskDir, 'implementation', 'WI-08c-handoff-message.md');

if (!existsSync(handoffPath)) {
  console.log('FAIL: handoff message file does not exist');
  console.log('  Expected:', handoffPath);
  process.exit(1);
}

let handoff = readFileSync(handoffPath, 'utf8');

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

console.log('Handoff message section 68 include checks:');

// Systems completed
check('systems completed mentioned', /system.*complet|complet.*system|features?/i.test(handoff));

// Performance
check('performance mentioned', /performance|frame|fps|smooth/i.test(handoff));

// Bugs fixed
check('bugs fixed mentioned', /bug|fix|defect/i.test(handoff));

// Content completeness
check('content completeness mentioned', /complete|progress|content|creature|implement/i.test(handoff));

// Whether full playthrough works
check('full playthrough works mentioned', /playthrough|play.*through|full.*game|ending/i.test(handoff));

console.log('\nHandoff message section 68 exclude checks:');

// No deep creature names/descriptions — these are generic checks
// Specific deep creature names from design_private would be caught by content review
check('no specific deep creature names', !/T-1[0-9]|T-2[0-9]|T-3[0-9]/.test(handoff));

// No lore truth
check('no lore truth mentioned', !/lore.*truth|the.*truth.*is|actually.*the/i.test(handoff));

// No MacGuffin truth
check('no MacGuffin truth mentioned', !/MacGuffin.*truth|the.*object.*is|retrieval.*reveals/i.test(handoff));

// No final encounter mechanics
check('no final encounter mechanics', !/final.*encounter|last.*boss|final.*fight/i.test(handoff));

// No ending variants
check('no ending variants mentioned', !/ending.*variant|good.*ending|bad.*ending|ending.*choice/i.test(handoff));

// No late-zone visuals
check('no late-zone visuals described', !/final.*zone.*looks|hadal.*zone.*visual|deepest.*area.*appearance/i.test(handoff));

console.log(`\nResults: ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('Failed:', failures.join(', '));
  process.exit(1);
}
console.log('All handoff message section 68 checks passed.');
