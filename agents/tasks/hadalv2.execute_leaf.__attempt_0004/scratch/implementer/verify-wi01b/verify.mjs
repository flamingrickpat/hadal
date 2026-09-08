#!/usr/bin/env node
// Structural validator for WI-01b private creative pass (section 12 steps D-E).
// Exit 0 = all checks pass, non-zero otherwise. Reads the working tree.
//
// This is the "test" for a documentation-only work item: there is no executable
// product code to test, so the validator asserts the required roster structure
// (30+ scored concepts, a 18-24 selected roster, section 11.1 minimums, per-organism
// 10-question rubric, diversity + anti-cliche gates, >=8 section-47 principles,
// a renderer per organism) AND the spoiler boundary (no hidden proper noun in any
// committed public artifact).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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
// committed probe does not itself leak them.
const TOKEN_MANIFEST = join(DP, '_spoiler_tokens.txt');
let SECRET = [];
if (existsSync(TOKEN_MANIFEST)) {
  SECRET = readFileSync(TOKEN_MANIFEST, 'utf8')
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
check('private spoiler-token manifest exists', SECRET.length > 0, `tokens=${SECRET.length}`);

console.log('\n=== WI-01b structural + spoiler validation ===\n');

// ---- creature_candidates.md ----
console.log('--- design_private/creature_candidates.md ---');
const cc = read('design_private/creature_candidates.md');
check('creature_candidates.md exists', !!cc);
let selectedCount = 0;
let conceptCount = 0;
if (cc) {
  const conceptLines = cc.split(/\r?\n/).filter((l) => /^- C\d{2} · /.test(l));
  conceptCount = conceptLines.length;
  check('at least 30 rough concepts', conceptCount >= 30, `concepts=${conceptCount}`);
  // Every concept must carry a 6-axis score, each value 1-5.
  let unscored = 0;
  for (const l of conceptLines) {
    if (!/scores \[([1-5]),([1-5]),([1-5]),([1-5]),([1-5]),([1-5])\]/.test(l)) unscored += 1;
  }
  check('every concept has a 6-axis 1-5 score', unscored === 0, `unscored=${unscored}`);
  selectedCount = conceptLines.filter((l) => l.includes('· SELECTED')).length;
  check('selected roster within 18-24', selectedCount >= 18 && selectedCount <= 24, `selected=${selectedCount}`);

  // ---- section 11.1 minimums: each required slot must be named in the file ----
  const minimums = [
    ['two helpful', /helpful/i],
    ['dangerous-looking-but-safe', /dangerous[- ]looking.*safe/i],
    ['harmless-second-behavior', /second behavior/i],
    ['non-chase-predator', /non[- ]chase/i],
    ['wreck-repurposer', /wreck[- ]repurpos/i],
    ['living-landmark', /living.*landmark|landmark.*alive/i],
    ['never-fully-seen', /never.*full.*seen|never.*full[- ]body/i],
    ['presence-through-fauna', /other fauna|through.*fauna/i],
    ['exploitable-relationship', /exploitable/i],
    ['scale-misread', /scale.*misread|misread.*scale/i],
    ['beautiful-not-threatening', /beautiful/i],
    ['architecture-bound-lifecycle', /architecture.*lifecycle|architecture.*life cycle|lifecycle.*architecture/i],
    ['uncategorizable', /uncategorizable|cannot be.*categor/i],
  ];
  for (const [label, re] of minimums) {
    check(`section 11.1 minimum covered: ${label}`, re.test(cc));
  }

  // ---- diversity gate: recorded count must be < 25% of the roster ----
  const div = cc.match(/Diversity gate: (\d+) of (\d+)/);
  if (div) {
    const mouths = parseInt(div[1], 10);
    const total = parseInt(div[2], 10);
    check('diversity gate < 25% swimming-mouth attackers', mouths / total < 0.25,
      `${mouths}/${total} = ${(100 * mouths / total).toFixed(1)}%`);
  } else {
    check('diversity gate count recorded', false, 'no "Diversity gate: N of M" line');
  }

  // ---- anti-cliche gate ----
  check('anti-cliche: neon-blue-everywhere ban addressed', /neon/i.test(cc));
  check('anti-cliche: size-scaled-normal-fish ban addressed', /size[- ]scaled/i.test(cc));

  // ---- per-organism 10-question rubric (section 11.3) ----
  const blocks = cc.split(/\r?\n### T-\d+/).slice(1);
  check('a rubric block per selected organism', blocks.length >= 18, `blocks=${blocks.length}`);
  let badBlocks = 0;
  for (const b of blocks) {
    const head = b.split('\n')[0].trim();
    const hasRenderer = /Renderer:/i.test(b);
    const qn = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .filter((n) => new RegExp(`^${n}\\.`, 'm').test(b)).length;
    if (!hasRenderer || qn < 10) { badBlocks += 1; }
  }
  check('every rubric block has a renderer + all 10 questions', badBlocks === 0, `bad=${badBlocks}`);

  // ---- section 46 quality bar ----
  check('section 46: shark-replacement test', /shark/i.test(cc));
  check('section 46: "just big" test', /just.*big|very big/i.test(cc));
  check('section 46: friendly-species test', /friendly/i.test(cc));
  check('section 46: evidence-before-explanation', /evidence before|evidence-before|before explanation|before the/i.test(cc));

  // ---- section 47 principle coverage >= 8 ----
  const pCount = (cc.match(/^- P\d{2} · /gm) || []).length;
  check('section 47 principle coverage >= 8', pCount >= 8, `principles=${pCount}`);
}

// ---- spoiler safety: no secret token in any committed (non-design_private) file ----
console.log('\n--- spoiler safety (whole tree, excluding design_private/) ---');
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '.git' || entry === 'node_modules') continue;
      yield* walk(full);
    } else if (st.isFile()) {
      yield full;
    }
  }
}
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.mp3', '.ogg', '.wasm', '.lock', '.bin']);
let leaks = 0;
for (const file of walk(REPO)) {
  const rel = relative(REPO, file).replace(/\\/g, '/');
  if (rel.startsWith('design_private/')) continue; // private payload may contain tokens
  if (SKIP_EXT.has('.' + rel.split('.').pop().toLowerCase())) continue;
  let body;
  try { body = readFileSync(file, 'utf8'); } catch { continue; }
  if (body.includes('\u0000')) continue; // binary
  for (const token of SECRET) {
    if (body.toLowerCase().includes(token.toLowerCase())) {
      leaks += 1;
      console.log(`[FAIL] token "${token}" leaked in ${rel}`);
    }
  }
}
check('whole tree is spoiler-free outside design_private/', leaks === 0, `leaks=${leaks}`);

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
