#!/usr/bin/env node
// Structural validator for WI-01a private creative pass (section 12 steps A-C).
// Exit 0 = all checks pass, non-zero otherwise. Reads the working tree.
//
// This is the "test" for a documentation-only work item: there is no executable
// product code to test, so the validator asserts the required document structure
// and the spoiler boundary (no hidden proper noun in any committed artifact).

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const DP = join(REPO, 'design_private');

let failures = 0;
function check(name, ok, detail = '') {
  const tag = ok ? 'PASS' : 'FAIL';
  if (!ok) failures += 1;
  console.log(`[${tag}] ${name}${detail ? ' — ' + detail : ''}`);
}

function read(rel) {
  const p = join(REPO, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

// ---- Secret proper nouns: read from a PRIVATE (gitignored) manifest so this
// committed probe does not itself leak them. Each non-empty line is a token that
// MUST appear in the private design files and MUST NOT appear in any committed
// public artifact.
const TOKEN_MANIFEST = join(DP, '_spoiler_tokens.txt');
let SECRET = [];
if (existsSync(TOKEN_MANIFEST)) {
  SECRET = readFileSync(TOKEN_MANIFEST, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
check('private spoiler-token manifest exists', SECRET.length > 0, `tokens=${SECRET.length}`);

// Public (committed) artifacts that must stay spoiler-free.
const PUBLIC_ARTIFACTS = [
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/plan.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/understanding.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/state.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/request.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/workitems/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/workitems/WI-01a.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/implementation/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0001/implementation/WI-01a-implementation.md',
  'agents/tasks/hadalv2/stories/ST-01/plan.md',
  'agents/tasks/hadalv2/stories/ST-01/workitems/WI-01a.md',
];

console.log('=== WI-01a structural + spoiler validation ===\n');

// ---- world_candidates.md ----
console.log('--- design_private/world_candidates.md ---');
const wc = read('design_private/world_candidates.md');
check('world_candidates.md exists', !!wc);
if (wc) {
  for (const letter of ['A', 'B', 'C']) {
    check(`Candidate ${letter} section present`, new RegExp(`Candidate ${letter}[\\s\\.:]`).test(wc));
  }
  // Each candidate must carry a step-B critique covering all six axes.
  const axes = ['Cliche', 'Exposition', 'Mystery', 'Creature support', 'Deliverability', 'Reinterpretation'];
  const sections = wc.split(/^##\s+Candidate/m).slice(1);
  for (const s of sections) {
    const head = s.split('\n')[0].trim();
    for (const ax of axes) {
      check(`critique axis "${ax}" in ${head}`, s.includes(ax));
    }
    check(`critique block present in ${head}`, /critique/i.test(s));
  }
  check('an explicit rejection naming a weakest candidate', /rejected/i.test(wc) && /weakest/i.test(wc));
}

// ---- final_selected_world.md ----
console.log('\n--- design_private/final_selected_world.md ---');
const fsel = read('design_private/final_selected_world.md');
check('final_selected_world.md exists', !!fsel);
if (fsel) {
  const selMatch = fsel.match(/Selected candidate:\s*([ABC])/);
  check('a named selected candidate (A/B/C)', !!selMatch, selMatch ? selMatch[1] : '');
  const srcCount = (fsel.match(/Source candidate:/g) || []).length;
  check('exactly one stolen mechanism (one "Source candidate:")', srcCount === 1, `count=${srcCount}`);
  const mechSrc = fsel.match(/Source candidate:\s*([ABC])/);
  check('stolen mechanism names a source candidate', !!mechSrc, mechSrc ? mechSrc[1] : '');
  if (selMatch && mechSrc) {
    check('stolen mechanism comes from a NON-selected (rejected) candidate', selMatch[1] !== mechSrc[1],
      `selected=${selMatch[1]} source=${mechSrc[1]}`);
  }
  check('selection is explicit, not an average', /hybridiz/i.test(fsel) || /not an? average/i.test(fsel));
}

// ---- lore_truth.md ----
console.log('\n--- design_private/lore_truth.md ---');
const lt = read('design_private/lore_truth.md');
check('lore_truth.md exists', !!lt);
if (lt) {
  check('central event section', /central event/i.test(lt));
  check('contradictions section (official vs observed)', /contradiction/i.test(lt) && /official/i.test(lt));
  check('foreshadow traces section', /foreshadow/i.test(lt));
  // Each major late reveal must plant 2-4 earlier traces. Count reveal
  // subsections and their trace bullets.
  const reveals = lt.split(/^###\s+Reveal/im).slice(1);
  check('at least 3 major reveals with trace blocks', reveals.length >= 3, `reveals=${reveals.length}`);
  for (const r of reveals) {
    const name = r.split('\n')[0].trim();
    const bullets = (r.match(/^\s*[-*]\s+\S/gm) || []).length;
    check(`reveal "${name}" plants 2-4 traces`, bullets >= 2 && bullets <= 4, `traces=${bullets}`);
  }
  check('an explicitly unanswered largest-scale implication', /unanswered|largest[- ]scale/i.test(lt));
}

// ---- spoiler safety ----
console.log('\n--- spoiler safety (public surface must not name hidden content) ---');
// Positive: the private files DO define the secret vocabulary (proves it was written).
const dpAll = [wc, fsel, lt].filter(Boolean).join('\n');
for (const token of SECRET) {
  check(`secret token "${token}" present in design_private/`, dpAll.toLowerCase().includes(token.toLowerCase()));
}
// Negative: no public (committed) artifact contains a secret token.
for (const pub of PUBLIC_ARTIFACTS) {
  const body = read(pub);
  if (body === null) continue; // not yet created; checked separately
  const hits = SECRET.filter((t) => body.toLowerCase().includes(t.toLowerCase()));
  check(`${pub} is spoiler-free`, hits.length === 0, hits.join(', '));
}

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
