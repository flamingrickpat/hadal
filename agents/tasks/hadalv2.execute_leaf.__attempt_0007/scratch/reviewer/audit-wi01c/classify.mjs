#!/usr/bin/env node
// Classification pass over the same corpus: distinguishes real T-ID
// references (not substrings of ST-NN / WI-NN / etc.) from collisions,
// and lists forbidden-token hits with file:line + context for manual review.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const REPO = process.cwd();
const git = (a) => execSync(`git ${a}`, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out = [];
const say = (s) => { out.push(s); };

const raw = readFileSync(join(REPO, 'design_private', '_spoiler_tokens.txt'), 'utf8')
  .split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const TIDS = raw.filter((t) => /^T-\d{2}$/.test(t));
const FORBIDDEN = raw.filter((t) => !/^T-\d{2}$/.test(t));
const IDX = Object.fromEntries(raw.map((t, i) => [t, i]));

const files = git('ls-files').split('\n').filter((f) => f && !f.startsWith('design_private/'));

say(`=== T-ID classification (tracked public tree, ${files.length} files) ===`);
let real = 0, substr = 0;
for (const f of files) {
  let body; try { body = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
  if (body.includes('\u0000')) continue;
  for (const tid of TIDS) {
    let i = body.indexOf(tid);
    while (i !== -1) {
      const prev = i > 0 ? body[i - 1] : '';
      const next = i + tid.length < body.length ? body[i + tid.length] : '';
      const wordLikePrev = /[A-Za-z0-9]/.test(prev);
      if (wordLikePrev) { substr += 1; }
      else {
        real += 1;
        const line = body.slice(0, i).split('\n').length;
        const ctx = body.slice(Math.max(0, i - 70), i + tid.length + 70).replace(/\s+/g, ' ');
        say(`REAL ${f}:L${line} [${tid}] -> ...${ctx}...`);
      }
      i = body.indexOf(tid, i + 1);
    }
  }
}
say(`T-ID: real=${real} substring-collisions=${substr}`);

say('');
say('=== T-ID classification (all commit messages, git log --all) ===');
let realC = 0;
const logB = git('log --all --pretty=format:@@@%H%n%B');
for (const chunk of logB.split('@@@').filter(Boolean)) {
  const lines = chunk.split('\n');
  const hash = lines.shift();
  for (let ln = 0; ln < lines.length; ln++) {
    const l = lines[ln];
    for (const tid of TIDS) {
      let i = l.indexOf(tid);
      while (i !== -1) {
        const prev = i > 0 ? l[i - 1] : '';
        if (!/[A-Za-z0-9]/.test(prev)) {
          realC += 1;
          say(`REAL commit ${hash.slice(0, 7)}:L${ln + 1} [${tid}] -> ${l.slice(0, 160)}`);
        }
        i = l.indexOf(tid, i + 1);
      }
    }
  }
}
say(`T-ID commits: real=${realC}`);

say('');
say('=== Forbidden token hits, tracked public tree (file:line, token INDEX, context) ===');
let fh = 0;
for (const f of files) {
  let body; try { body = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
  if (body.includes('\u0000')) continue;
  const lines = body.split('\n');
  for (const tok of FORBIDDEN) {
    for (let ln = 0; ln < lines.length; ln++) {
      let i = lines[ln].indexOf(tok);
      while (i !== -1) {
        fh += 1;
        say(`F ${f}:L${ln + 1} #${IDX[tok]} -> ${lines[ln].slice(Math.max(0, i - 50), i + tok.length + 50)}`);
        i = lines[ln].indexOf(tok, i + 1);
      }
    }
  }
}
say(`forbidden-tree-hits=${fh}`);

say('');
say('=== Forbidden token hits, all commit messages ===');
let fc = 0;
for (const chunk of logB.split('@@@').filter(Boolean)) {
  const lines = chunk.split('\n');
  const hash = lines.shift();
  for (let ln = 0; ln < lines.length; ln++) {
    const l = lines[ln];
    for (const tok of FORBIDDEN) {
      let i = l.indexOf(tok);
      while (i !== -1) {
        fc += 1;
        say(`C commit ${hash.slice(0, 7)}:L${ln + 1} #${IDX[tok]} -> ${l.slice(Math.max(0, i - 50), i + tok.length + 50)}`);
        i = l.indexOf(tok, i + 1);
      }
    }
  }
}
say(`forbidden-commit-hits=${fc}`);

process.stdout.write(out.join('\n'));
