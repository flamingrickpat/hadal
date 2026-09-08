#!/usr/bin/env node
// Structural + spoiler validator for WI-01c (section 12 step F, final audit).
// Exit 0 = all checks pass, non-zero otherwise. Reads the working tree.
//
// Documentation-only work item: the "test" asserts (1) the required structure
// of design_private/encounter_beats.md (beat grid, reveal assignment, motifs,
// MacGuffin, endings, lore-clue mapping), (2) the structure of
// design_private/spoiler_map.md, and (3) the final spoiler audit: gitignore
// state, story commit messages, and the whole public tree for hidden tokens.
//
// No secret token literals live in this file: tokens are read from the
// private manifest design_private/_spoiler_tokens.txt.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

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
function git(args) {
  try { return execSync(`git ${args}`, { cwd: REPO, encoding: 'utf8' }); }
  catch { return null; }
}

// ---- tokens (private manifest) ----
const raw = (existsSync(join(DP, '_spoiler_tokens.txt'))
  ? readFileSync(join(DP, '_spoiler_tokens.txt'), 'utf8') : '')
  .split(/\r?\n/).map((s) => s.trim())
  .filter((s) => s && !s.startsWith('#'));
const TIDS = raw.filter((t) => /^T-\d{2}$/.test(t));
const FORBIDDEN = raw.filter((t) => !/^T-\d{2}$/.test(t));
check('private spoiler-token manifest populated', FORBIDDEN.length >= 25,
  `forbidden=${FORBIDDEN.length} tids=${TIDS.length}`);

console.log('\n=== WI-01c structural + spoiler validation ===\n');

// ---- design_private/encounter_beats.md ----
console.log('--- design_private/encounter_beats.md ---');
const eb = read('design_private/encounter_beats.md');
check('encounter_beats.md exists', !!eb);
if (eb) {
  for (const re of [/^# .*timeline/im, /## .*macguffin/im, /## .*motif/im,
                    /## .*ending/im, /## .*lore clue/im]) {
    check(`section present: ${re.source.replace(/^#*\s*/g, '')}`, re.test(eb));
  }
  // beat rows: "- BNN · a[-–]b min — ..."
  const beats = eb.split(/\r?\n/).filter((l) => /^- B\d{2} · \d{1,3}[-–]\d{1,3} min/.test(l));
  check('beat grid has >= 10 beats', beats.length >= 10, `beats=${beats.length}`);
  let badDur = 0, badNum = 0;
  const numbers = [];
  for (const l of beats) {
    const m = l.match(/^- B(\d{2}) · (\d{1,3})[-–](\d{1,3}) min/);
    const d = parseInt(m[3], 10) - parseInt(m[2], 10);
    if (d < 3 || d > 6) badDur += 1;
    numbers.push(parseInt(m[1], 10));
  }
  numbers.sort((a, b) => a - b);
  for (let i = 0; i + 1 < numbers.length; i += 1) {
    if (numbers[i + 1] !== numbers[i] + 1) badNum += 1;
  }
  check('every beat is 3-6 minutes', badDur === 0, `bad=${badDur}`);
  check('beat numbering is contiguous', badNum === 0);

  // reveal assignment: every selected roster id appears in the timeline
  const cc = read('design_private/creature_candidates.md') || '';
  const roster = [...cc.matchAll(/^- C\d{2} · (T-\d{2}) .*· SELECTED/gm)]
    .map((m) => m[1]);
  check('roster parsed from creature_candidates.md', roster.length >= 18,
    `roster=${roster.length}`);
  const missing = roster.filter((id) => !eb.includes(id));
  check('every roster reveal assigned to a beat', missing.length === 0,
    missing.length ? `missing=${missing.join(',')}` : 'all assigned');

  // best ideas not all in the first half: >= 3 roster ids in beats from 60 min on
  const late = beats.filter((l) => {
    const m = l.match(/· (\d{1,2})[-–]/); return m && parseInt(m[1], 10) >= 60;
  }).join('\n');
  const lateIds = roster.filter((id) => late.includes(id));
  check('>= 3 roster reveals at/after minute 60', lateIds.length >= 3,
    `late=${lateIds.length}`);

  // five spectacle beats tagged
  const spectacles = eb.match(/\[S\d spectacle\]/g) || [];
  check('exactly five spectacle beats tagged', spectacles.length === 5,
    `spectacles=${spectacles.length}`);

  // motifs: 3-5, each with contexts, final-reveal connection with unexplained remainder
  const motifs = eb.match(/^### M-\d+/gm) || [];
  check('3-5 recurring motifs', motifs.length >= 3 && motifs.length <= 5,
    `motifs=${motifs.length}`);
  check('motif contexts listed', /contexts:/im.test(eb));
  check('final reveal connects motifs without explaining all',
    /final reveal/i.test(eb) && /unexplained/i.test(eb));

  // MacGuffin (section 23)
  check('macguffin: visually memorable', /visually memorable/i.test(eb));
  const traces = (eb.match(/^\s*- Trace/gm) || []).length;
  check('macguffin: >= 2 earlier environmental traces', traces >= 2, `traces=${traces}`);
  check('macguffin: retrieval changes environment/return journey',
    /retrieval/i.test(eb) && /return journey/i.test(eb));
  check('macguffin: forces one final decision', /final decision/i.test(eb));
  check('macguffin: final minutes mechanically different',
    /mechanically different/i.test(eb));
  check('no glowing-orb-fade ending', !/glowing orb/i.test(eb) && !/fade to credits/i.test(eb));

  // endings (section 24): two variants, modest-scope tagged, cut candidate noted
  const eLines = eb.split(/\r?\n/).filter((l) => /^\| E-[12] /.test(l));
  check('two ending variants present', eLines.length === 2, `rows=${eLines.length}`);
  check('each ending tagged modest-scope',
    eLines.length === 2 && eLines.every((l) => /modest-scope/i.test(l)));
  check('one variant tagged as section 72 cut candidate', /cut candidate/i.test(eb));

  // lore clues: four reveals, each 2+ traces, each trace pointing at a real beat
  const rCount = (eb.match(/^### R\d/gm) || []).length;
  check('four major late reveals mapped', rCount === 4, `reveals=${rCount}`);
  const traceLines = eb.split(/\r?\n/).filter((l) => /^- trace:/i.test(l));
  const refBeats = [...traceLines.join('\n').matchAll(/\bB(\d{2})\b/g)].map((m) => m[1]);
  const unknownRefs = refBeats.filter((n) => !numbers.includes(parseInt(n, 10)));
  check('every lore clue references an existing beat',
    traceLines.length >= 8 && unknownRefs.length === 0,
    `traces=${traceLines.length} unknown=${unknownRefs.join(',')}`);
}

// ---- design_private/spoiler_map.md ----
console.log('\n--- design_private/spoiler_map.md ---');
const sm = read('design_private/spoiler_map.md');
check('spoiler_map.md exists', !!sm);
if (sm) {
  const facts = sm.match(/^\| S-\d+ /gm) || [];
  check('secret facts table present (>= 6 facts)', facts.length >= 6, `facts=${facts.length}`);
  check('artifact paths recorded for facts', /design_private\//.test(sm));
  check('public-surface ban list present', /ban list/i.test(sm));
  for (const phrase of ['deep creatures', 'lore truth', 'MacGuffin', 'ending']) {
    check(`ban list covers: ${phrase}`, new RegExp(phrase, 'i').test(sm));
  }
  check('final audit section present', /final spoiler audit/i.test(sm));
  for (const item of ['gitignore', 'commit message', 'every file in']) {
    check(`audit covers: ${item}`, new RegExp(item, 'i').test(sm));
  }
  // every design_private file is accounted for in the map
  const dpFiles = readdirSync(DP).filter((f) => f.endsWith('.md'));
  const unlisted = dpFiles.filter((f) => !sm.includes(f));
  check('every private artifact listed in the map', unlisted.length === 0,
    unlisted.length ? `unlisted=${unlisted.join(',')}` : 'all listed');
}

// ---- final spoiler audit (WI-01c is the final proof owner) ----
console.log('\n--- final spoiler audit ---');
// 1. gitignore state: design_private/ is ignored and untracked
let ignored = true;
try { execSync('git check-ignore -q design_private/encounter_beats.md', { cwd: REPO }); }
catch { ignored = false; }
check('design_private/ is gitignored', ignored);
check('no design_private file is tracked',
  (git('ls-files design_private/').trim() === ''));

// 2. story commit messages: every "creative pass:" subject is clean
const logOut = git('log --pretty=%s') || '';
const creativeSubjects = logOut.split('\n').filter((l) => l.startsWith('creative pass:'));
check('story creative-pass commits found', creativeSubjects.length >= 2,
  `commits=${creativeSubjects.length}`);
let msgLeaks = 0;
for (const subj of creativeSubjects) {
  for (const token of FORBIDDEN) {
    if (subj.includes(token)) { msgLeaks += 1; console.log(`[FAIL] token "${token}" in subject "${subj}"`); }
  }
}
check('no creative-pass commit message names hidden content', msgLeaks === 0,
  `leaks=${msgLeaks}`);

// 3. whole public tree: no forbidden token outside design_private/.
// Minified vendor bundles (*.min.*) are skipped: one-word namespace
// collisions in third-party minified code are not spoiler leaks (recorded
// in the audit section of spoiler_map.md).
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
let treeLeaks = 0;
for (const file of walk(REPO)) {
  const rel = relative(REPO, file).replace(/\\/g, '/');
  if (rel.startsWith('design_private/')) continue;
  if (/\.min\.(js|css)$/i.test(rel)) continue;
  let body;
  try { body = readFileSync(file, 'utf8'); } catch { continue; }
  if (body.includes('\u0000')) continue;
  for (const token of FORBIDDEN) {
    if (body.includes(token)) {
      treeLeaks += 1;
      console.log(`[FAIL] token "${token}" leaked in ${rel}`);
    }
  }
}
check('whole public tree is spoiler-free (case-sensitive)', treeLeaks === 0,
  `leaks=${treeLeaks}`);

// 4. this work item's committed artifacts are clean of ALL tokens
//    (including the T-IDs, which pre-approved WI-01b artifacts already use).
const TOUCHED = [
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/implementation/WI-01c-implementation.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/implementation/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/AGENTS.md',
  'agents/projects/hadal/notes/20260909-implementer-wi01c-reveal-mapping.md',
];
let touchedLeaks = 0;
for (const rel of TOUCHED) {
  const body = read(rel);
  if (body === null) { check(`touched artifact exists: ${rel}`, false); continue; }
  for (const token of raw) {
    if (body.includes(token)) { touchedLeaks += 1; console.log(`[FAIL] token "${token}" in ${rel}`); }
  }
}
check('this work item\'s committed artifacts contain no tokens at all',
  touchedLeaks === 0, `leaks=${touchedLeaks}`);

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
