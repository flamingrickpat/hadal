// Reviewer probe: independent raw-source geometry check of the tier-4 placement.
// Question: are the five tier-4 spawns (T-19, T-20, T-22, T-23, T-25) inside
// their chunk bounds and outside every closed slab in the whole world?
// Parses worldData.ts text directly (independent of the test's makeSimWorld path).
import { readFileSync } from 'node:fs';

const src = readFileSync('C:/Temp/hadal-v2/src/world/worldData.ts', 'utf8');

// Chunk header blocks: id / band / bounds.
const chunks = [];
for (const m of src.matchAll(/const (\w+): WorldChunkDef = \{[\s\S]*?id: '([^']*)',\s*band: (\d),\s*bounds: \{ x: (-?\d+), y: (-?\d+), w: (\d+), h: (\d+) \}/g)) {
  chunks.push({ name: m[1], id: m[2], band: +m[3], x: +m[4], y: +m[5], w: +m[6], h: +m[7] });
}

// All closed slabs (axis-aligned via the slab() helper): slab('id', x, y, w, h).
const slabs = [];
for (const m of src.matchAll(/slab\('([^']*)',\s*(-?\d+),\s*(-?\d+),\s*(\d+),\s*(\d+)\)/g)) {
  slabs.push({ id: m[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
}

// Spawns grouped by the chunk literal they sit in.
// Segment 0 is the file preamble; segment i (i>=1) belongs to chunks[i-1].
const spawnBlocks = src.split(/const \w+: WorldChunkDef = \{/).map((seg, i) => {
  const chunk = i >= 1 ? (chunks[i - 1] ?? null) : null;
  const spawns = [...seg.matchAll(/\{ id: '([^']*)', creature: '(T-\d+)', position: vec2\((-?\d+), (-?\d+)\), count: (\d+) \}/g)]
    .map((m) => ({ id: m[1], creature: m[2], x: +m[3], y: +m[4], count: +m[5] }));
  return { chunk, spawns };
});

let fail = 0;
const note = (s) => { console.log(s); };
const bad = (s) => { fail += 1; console.log('  FAIL: ' + s); };

note(`chunks parsed: ${chunks.length} (${chunks.map((c) => `${c.id}(b${c.band})`).join(', ')})`);
note(`closed slabs parsed: ${slabs.length}`);

for (const { chunk, spawns } of spawnBlocks) {
  if (!chunk) continue;
  for (const s of spawns) {
    const inBounds = s.x >= chunk.x && s.x <= chunk.x + chunk.w && s.y >= chunk.y && s.y <= chunk.y + chunk.h;
    if (!inBounds) bad(`${s.id} (${s.creature}) outside chunk ${chunk.id} bounds (${s.x},${s.y})`);
    const inside = slabs.filter((sl) => s.x > sl.x && s.x < sl.x + sl.w && s.y > sl.y && s.y < sl.y + sl.h);
    if (inside.length) bad(`${s.id} (${s.creature}) strictly inside slab(s): ${inside.map((i) => i.id).join(', ')}`);
  }
}

// Tier-4 specific: each of the five ids lands exactly where the roster band says.
const T4_BANDS = { 'T-19': 4, 'T-20': 5, 'T-22': 4, 'T-23': 5, 'T-25': 5 };
for (const [id, band] of Object.entries(T4_BANDS)) {
  const placed = [];
  for (const { chunk, spawns } of spawnBlocks)
    for (const s of spawns) if (s.creature === id) placed.push({ chunk: chunk.id, band: chunk.band });
  if (placed.length === 0) bad(`${id}: no spawn found in raw source`);
  else for (const p of placed) {
    if (p.band !== band) bad(`${id} in chunk ${p.chunk} band ${p.band}, roster band ${band}`);
    else note(`${id} -> chunk ${p.chunk} (band ${p.band}) matches roster band ${band}`);
  }
}

const total = spawnBlocks.reduce((n, b) => n + b.spawns.length, 0);
note(`total spawns parsed: ${total}; distinct creature types: ${new Set(spawnBlocks.flatMap((b) => b.spawns.map((s) => s.creature))).size}`);
console.log(fail === 0 ? 'PROBE PASS' : `PROBE FAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
