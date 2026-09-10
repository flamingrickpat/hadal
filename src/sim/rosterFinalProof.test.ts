/**
 * Tests — the roster-wide FINAL PROOFS ST-03 assigns to the tier-4 leaf
 *   (WI-03d3): the whole-roster world-data count check (AC-roster-count —
 *   the production world data carries 15+ distinct active creature types,
 *   the full private-roster selection of 18-24, every id resolves, every
 *   spawn sits in the band the roster designed it for) and the
 *   roster-wide test-existence + spoiler audit (AC-roster-tests — every
 *   implemented major species has a headless signature-rule scenario, and
 *   no creature name or secret description appears outside debug internals
 *   and the private content files — request §0, §12, §68). The per-tier
 *   portions were already checked in each tier's own item; this is the
 *   final, whole-roster pass over the production world data (no fixtures).
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSimWorld, Simulation } from './Simulation';
import { CREATURE_BY_ID } from '../creatures/fixtures';
import {
  HIDDEN_CREATURES,
  TIER1_BANDS,
  TIER2_BANDS,
  TIER3_BANDS,
  TIER4_BANDS,
} from '../content/secret/hiddenCreatures';

const here = dirname(fileURLToPath(import.meta.url));

/** The designed bands of every roster tier, merged for the whole-roster pass. */
const BANDS: Record<string, ReadonlySet<number>> = {
  ...TIER1_BANDS,
  ...TIER2_BANDS,
  ...TIER3_BANDS,
  ...TIER4_BANDS,
};

/** Every implemented major species (the private roster, all four tiers). */
const ROSTER_IDS: string[] = HIDDEN_CREATURES.map((d) => d.id);

/** The strict bounding-box containment test (the per-tier clearance pattern). */
function slabContainment(): (p: { x: number; y: number }) => string[] {
  const slabs = makeSimWorld().chunks.flatMap((c) => c.terrain).filter((s) => s.closed);
  return (p) =>
    slabs
      .filter((s) => {
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (const pt of s.points) {
          minX = Math.min(minX, pt.x);
          maxX = Math.max(maxX, pt.x);
          minY = Math.min(minY, pt.y);
          maxY = Math.max(maxY, pt.y);
        }
        return p.x > minX && p.x < maxX && p.y > minY && p.y < maxY;
      })
      .map((s) => s.id);
}

describe('FINAL PROOF AC-roster-count: the whole-roster world data (WI-03d3)', () => {
  it('the production world constructs: every creature id resolves through the registry (request §32)', () => {
    // The production Simulation resolves every authored spawn id against
    // CREATURE_BY_ID and throws on an unknown one — a clean construction is
    // the resolution proof for the world that is shipped.
    const sim = new Simulation(makeSimWorld(), 1);
    expect(sim.creatures.length, 'the production world spawns creatures').toBeGreaterThan(0);
    for (const chunk of sim.chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        expect(CREATURE_BY_ID[spawn.creature], `spawn ${spawn.id} references unknown creature ${spawn.creature}`).toBeDefined();
      }
    }
  });

  it('15+ distinct types are active with their spawns, and the full private-roster selection (18-24) is present (§11.1)', () => {
    const active = new Set<string>();
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) active.add(spawn.creature);
    }
    expect(active.size, 'at least 15 distinct implemented creature types are active').toBeGreaterThanOrEqual(15);
    // The private roster selects 18-24 organisms (request §11.1); the
    // implemented selection is exactly the roster, and every one of it is
    // active in the production world data.
    expect(HIDDEN_CREATURES.length, 'the roster selection sits in the 18-24 range').toBeGreaterThanOrEqual(18);
    expect(HIDDEN_CREATURES.length, 'the roster selection sits in the 18-24 range').toBeLessThanOrEqual(24);
    for (const id of ROSTER_IDS) {
      expect(active.has(id), `${id} has no spawn in the production world data`).toBe(true);
    }
  });

  it('every spawn sits in the band it was designed for, and each species covers every designed band (distribution, §11.1)', () => {
    const bandsById = new Map<string, Set<number>>();
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        const def = CREATURE_BY_ID[spawn.creature];
        expect(def, `spawn ${spawn.id} references unknown creature ${spawn.creature}`).toBeDefined();
        const inBounds =
          spawn.position.x >= chunk.bounds.x &&
          spawn.position.x <= chunk.bounds.x + chunk.bounds.w &&
          spawn.position.y >= chunk.bounds.y &&
          spawn.position.y <= chunk.bounds.y + chunk.bounds.h;
        expect(inBounds, `spawn ${spawn.id} outside chunk ${chunk.id} bounds`).toBe(true);
        const allowed = BANDS[spawn.creature];
        expect(allowed, `spawn ${spawn.id} for ${spawn.creature} has no designed bands`).toBeDefined();
        expect(
          allowed!.has(chunk.band),
          `${spawn.creature} in chunk ${chunk.id} band ${chunk.band} (designed ${[...allowed!].join(',')})`,
        ).toBe(true);
        if (!bandsById.has(spawn.creature)) bandsById.set(spawn.creature, new Set());
        bandsById.get(spawn.creature)!.add(chunk.band);
      }
    }
    // Whole-roster distribution: each species is present in every band the
    // private roster designed it for, so no band is an empty corridor.
    for (const id of ROSTER_IDS) {
      const placed = bandsById.get(id) ?? new Set<number>();
      for (const band of BANDS[id]!) {
        expect(placed.has(band), `${id} is missing from band ${band} in the production world data`).toBe(true);
      }
    }
  });

  it('no spawn sits inside a closed terrain slab, except the one documented pre-existing exception (§49)', () => {
    // A spawn whose center is strictly inside a solid slab is trapped there:
    // the terrain resolve only pushes a circle out near an edge (see the
    // spawn-clearance note). Every closed authored slab is an axis-aligned
    // rectangle, so strict bounding-box containment is exact.
    const trappedBy = slabContainment();
    const trapped: { spawn: string; slab: string }[] = [];
    for (const chunk of makeSimWorld().chunks) {
      for (const spawn of chunk.creatureSpawns ?? []) {
        const hits = trappedBy(spawn.position);
        for (const slab of hits) trapped.push({ spawn: spawn.id, slab });
      }
    }
    // Documented pre-existing exception (routed to the fix-planning path by
    // the WI-03b2 re-land, commit d93c720's review): the tier-1 twilight
    // congregation spawn sits inside the shelf band's floor slab. The
    // whole-roster pass must surface it exactly once — any other trapped
    // spawn (or its repair) fails this check loudly.
    expect(trapped).toEqual([{ spawn: 't03-twilight', slab: 'shelf-floor-east' }]);
  });
});

describe('FINAL PROOF AC-roster-tests: roster-wide test existence (WI-03d3)', () => {
  it('every implemented major species has a headless signature-rule scenario', () => {
    // The per-species signature-rule scenarios live in the tier scenario
    // files (and the shared creature/ecology scenario files). A species
    // qualifies when one of them carries a per-species describe block.
    const scenarioFiles = [
      'tier1Scenario.test.ts',
      'tier2Scenario.test.ts',
      'tier3Scenario.test.ts',
      'tier4Scenario.test.ts',
      'creatureScenario.test.ts',
      'ecologyScenario.test.ts',
    ];
    const describeLines = new Map<string, string[]>();
    for (const f of scenarioFiles) {
      const lines = readFileSync(join(here, f), 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.trimStart().startsWith('describe('));
      describeLines.set(f, lines);
    }
    for (const id of ROSTER_IDS) {
      // A per-species describe block names its id as a whole word anywhere in
      // the label (e.g. `'T-20: ...'` or `'... (T-19)'`).
      const re = new RegExp(`\\b${id}\\b`);
      const covered = [...describeLines.values()].some((lines) => lines.some((l) => re.test(l)));
      expect(covered, `${id} has no headless signature-rule scenario block`).toBe(true);
    }
  });
});

describe('FINAL PROOF AC-roster-tests: spoiler audit of every ST-03 commit and artifact (§0/§12/§68)', () => {
  it('no creature name or secret description appears outside debug internals and the private content files', () => {
    // Token list from the private design files (gitignored): T-IDs are
    // internal identifiers — legal in identifiers, tests, and commit
    // messages per §68 — so only the name/description tokens are checked.
    const tokens = readFileSync(join(here, '..', '..', 'design_private', '_spoiler_tokens.txt'), 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'))
      .filter((l) => !/^T-\d\d$/.test(l))
      .map((l) => l.replace(/^The\s+/, '')) // "The X" and "X" are the same name
      .filter((l) => l.length >= 3);
    expect(tokens.length, 'the private token list covers the roster').toBeGreaterThanOrEqual(10);
    const matchers = tokens.map((t) => new RegExp(`\\b${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
    // The per-tier matching rule (case-insensitive, whole word): a token must
    // stand alone, so a short name is not flagged inside an unrelated longer
    // word, and a common English word is not flagged for a differently-shaped
    // name.
    const testToken = (text: string): string | undefined => {
      const low = text.toLowerCase();
      for (let i = 0; i < tokens.length; i += 1) {
        if (matchers[i]!.test(low)) return tokens[i];
      }
      return undefined;
    };

    type Offender = { where: string; token: string };
    const hard: Offender[] = []; // the product surface — must stay empty
    const meta: Offender[] = []; // meta-audit documents — classified below

    // 1) Every ST-03 commit message (implementation, review, planning, and
    //    controller commits of the story's work items).
    const log = execFileSync('git', ['log', '--format=%x01%H%x09%s%x09%b'], { encoding: 'utf8' });
    let scannedCommits = 0;
    for (const entry of log.split('\x01')) {
      const lines = entry.split(/\r?\n/);
      const head = lines.shift();
      if (!head) continue;
      const full = [head, ...lines].join('\n');
      if (!/ST-03|WI-03[a-d]/.test(full)) continue;
      scannedCommits += 1;
      const token = testToken(full);
      if (token) hard.push({ where: `commit ${full.slice(0, 40)}`, token });
    }
    expect(scannedCommits, 'the audit must reach the ST-03 commits').toBeGreaterThanOrEqual(40);

    // 2) The product source: spoiler content lives only in
    //    src/content/secret/ and design_private/ — everything else in src/
    //    must be clean (the secret file itself is included: it carries
    //    functional descriptors only).
    const srcDir = join(here, '..');
    const collectTs = (dir: string, out: string[]): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        let isDir = false;
        try {
          readdirSync(p);
          isDir = true;
        } catch {
          isDir = false;
        }
        if (isDir) collectTs(p, out);
        else if (name.endsWith('.ts')) out.push(p);
      }
    };
    const tsFiles: string[] = [];
    collectTs(srcDir, tsFiles);
    expect(tsFiles.length, 'the audit must reach the product source').toBeGreaterThanOrEqual(50);
    for (const p of tsFiles) {
      const token = testToken(readFileSync(p, 'utf8'));
      if (token) hard.push({ where: p, token });
    }

    // 3) Every ST-03 task artifact. The implementer deliverables
    //    (implementation/) are the hard scope — a name in an implementation
    //    note is a leak. The remaining artifacts are meta-audit documents:
    //    review reports name the tokens precisely to assert their absence,
    //    the scanner probes carry the token list by construction, and the
    //    controller/planner spec and state files quote the request text.
    //    Those are the only allowed meta homes — the same class as the token
    //    manifest itself, which must contain the tokens to name them.
    const taskFolders = [
      'hadalv2.execute_leaf.__attempt_0009', // WI-03a
      'hadalv2.execute_leaf.__attempt_0010', // WI-03b1 attempt
      'hadalv2.execute_leaf.__attempt_0011', // WI-03b1
      'hadalv2.execute_leaf.__attempt_0012', // WI-03b2
      'hadalv2.execute_leaf.__attempt_0013', // WI-03c1a attempt
      'hadalv2.execute_leaf.__attempt_0014', // WI-03c1a
      'hadalv2.execute_leaf.__attempt_0015', // WI-03c1b
      'hadalv2.execute_leaf.__attempt_0016', // WI-03c2
      'hadalv2.execute_leaf.__attempt_0017', // WI-03d1 attempt
      'hadalv2.execute_leaf.WI-03d1.__item_WI-03d1.__attempt_0001',
      'hadalv2.execute_leaf.WI-03d2.__item_WI-03d2.__attempt_0001',
      'hadalv2.execute_leaf.WI-03d3.__item_WI-03d3.__attempt_0001',
    ];
    const textExts = ['.md', '.ts', '.mjs', '.js', '.json', '.txt', '.ps1', '.html'];
    let scannedArtifacts = 0;
    const collectArtifacts = (dir: string, out: string[]): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        let isDir = false;
        try {
          readdirSync(p);
          isDir = true;
        } catch {
          isDir = false;
        }
        if (isDir) collectArtifacts(p, out);
        else if (textExts.some((e) => name.endsWith(e))) out.push(p);
      }
    };
    for (const folder of taskFolders) {
      const dir = join(here, '..', '..', 'agents', 'tasks', folder);
      if (!existsSync(dir)) continue;
      const files: string[] = [];
      collectArtifacts(dir, files);
      for (const p of files) {
        scannedArtifacts += 1;
        const rel = relative(dir, p).split(sep).join('/');
        const isMeta = !rel.startsWith('implementation/');
        const token = testToken(readFileSync(p, 'utf8'));
        if (!token) continue;
        (isMeta ? meta : hard).push({ where: p, token });
      }
    }
    expect(scannedArtifacts, 'the audit must reach the ST-03 task artifacts').toBeGreaterThanOrEqual(50);

    // The product surface, the commit history, and the implementer
    // deliverables must be clean of every name and secret description.
    hard.sort((a, b) => (a.where + a.token).localeCompare(b.where + b.token));
    expect(
      hard,
      `spoiler tokens in the product surface: ${hard.map((o) => `${o.where} :: ${o.token}`).join(', ')}`,
    ).toEqual([]);

    // Every meta hit must sit in a documented meta-audit home — a review
    // report, a scanner probe, or a controller/planner spec or state file.
    // A name anywhere else (a non-meta artifact) fails loudly.
    for (const m of meta) {
      const rel = m.where.split(sep).join('/');
      expect(
        rel,
        `spoiler token outside the allowed meta homes: ${rel} :: ${m.token}`,
      ).toMatch(/\/(reviews|scratch)\/|\/(state|request|understanding|plan)\.md$|\/workitems\/|\/AGENTS\.md$/);
    }
  });
});
