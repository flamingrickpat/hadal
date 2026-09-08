#!/usr/bin/env node
// Independent reviewer audit for WI-01c (AC-cp-spoiler).
// Read-only. Prints hits, never prints the token manifest itself.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const REPO = process.cwd();
const git = (a) => execSync(`git ${a}`, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ---- token manifest (private; read once, never printed) ----
const raw = readFileSync(join(REPO, 'design_private', '_spoiler_tokens.txt'), 'utf8')
  .split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const TIDS = raw.filter((t) => /^T-\d{2}$/.test(t));
const FORBIDDEN = raw.filter((t) => !/^T-\d{2}$/.test(t));
console.log(`tokens: forbidden=${FORBIDDEN.length} tids=${TIDS.length} total=${raw.length}`);

let leaks = 0;
function scanText(label, body, tokens) {
  for (const token of tokens) {
    let i = body.indexOf(token);
    while (i !== -1) {
      leaks += 1;
      const line = body.slice(0, i).split('\n').length;
      const ctx = body.slice(Math.max(0, i - 60), i + token.length + 60).replace(/\s+/g, ' ');
      console.log(`[HIT] ${label}:L${line} token#${raw.indexOf(token)} -> ...${ctx}...`);
      i = body.indexOf(token, i + token.length);
      if (i > 0 && body.slice(0, i).split('\n').length - line > 40) break; // cap per token
    }
  }
}

// ---- 1. all tracked public files, ALL tokens (incl. T-IDs), case-sensitive ----
console.log('\n--- 1. tracked public tree vs ALL tokens ---');
const files = git('ls-files').split('\n').filter((f) => f && !f.startsWith('design_private/'));
console.log(`tracked public files=${files.length}`);
for (const f of files) {
  let body;
  try { body = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
  if (body.includes('\u0000')) continue; // binary
  scanText(f, body, raw);
}

// ---- 2. all commit messages (subject+body), all branches, ALL tokens ----
console.log('\n--- 2. all commit messages vs ALL tokens ---');
const logB = git('log --all --pretty=format:@@@%H%n%B');
for (const chunk of logB.split('@@@').filter(Boolean)) {
  const [hash, ...rest] = chunk.split('\n');
  scanText(`commit ${hash.slice(0, 7)}`, rest.join('\n'), raw);
}

// ---- 3. this WI's five new public artifacts, ALL tokens ----
console.log('\n--- 3. this WI new public artifacts vs ALL tokens ---');
const NEW = [
  'agents/projects/hadal/notes/20260909-implementer-wi01c-reveal-mapping.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/implementation/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/implementation/WI-01c-implementation.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/AGENTS.md',
  'agents/tasks/hadalv2.execute_leaf.__attempt_0007/scratch/implementer/verify-wi01c/verify.mjs',
];
for (const f of NEW) {
  const body = readFileSync(join(REPO, f), 'utf8');
  scanText(f, body, raw);
}

// ---- 4. screenshot / image inventory ----
console.log('\n--- 4. image files in working tree ---');
let images = 0;
function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) { if (e !== '.git' && e !== 'node_modules') yield* walk(full); }
    else yield full;
  }
}
for (const f of walk(REPO)) {
  const rel = relative(REPO, f).replace(/\\/g, '/');
  if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(rel)) { images += 1; console.log(`[IMG] ${rel}`); }
}
console.log(`images=${images}`);

// ---- 5. case-insensitive spot-check, high-signal terms only ----
console.log('\n--- 5. case-insensitive spot-check (tracked public tree) ---');
let ciLeak = 0;
for (const term of ['cradle', 'germination', 'dormancy', 'meridian', 'attendant', 'governor']) {
  for (const f of files) {
    let body;
    try { body = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
    if (body.includes('\u0000')) continue;
    const lower = body.toLowerCase();
    let i = lower.indexOf(term);
    while (i !== -1) {
      ciLeak += 1;
      const line = body.slice(0, i).split('\n').length;
      const ctx = body.slice(Math.max(0, i - 50), i + term.length + 50).replace(/\s+/g, ' ');
      console.log(`[CI] ${f}:L${line} "${term}" -> ...${ctx}...`);
      i = lower.indexOf(term, i + term.length);
    }
  }
}
console.log(`ci-hits=${ciLeak} (classify manually: engineering vs leak)`);

console.log(`\nTOTAL EXACT-CASE HITS: ${leaks}`);
process.exit(0);
