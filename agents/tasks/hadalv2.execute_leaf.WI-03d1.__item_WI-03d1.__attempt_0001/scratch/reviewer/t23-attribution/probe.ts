/**
 * Reviewer probe — WI-03d1 T-23 attribution.
 *
 * Question: in the T-23 crossing scenario (tier4Scenario.test.ts, seed 441),
 * does the measured "fauna reaction" (drifters moving 50 units west) actually
 * come from the presence's announcement, or would the drifters react the same
 * way from the player's arrival alone?
 *
 * Run A replays the exact scenario with instrumentation (prints the measured
 * times). Run B replays the identical world and player path WITHOUT the
 * T-23 spawn and measures the same drifter displacement. If the drifters
 * react in B too, the test's ordering assertion is confounded; if they do
 * not, the reaction is attributable to the presence.
 *
 * Bounded: fixed 150 s sim, deterministic seed. No product code is modified.
 */
import { vec2 } from '../../../../../../src/util/math';
import { emptyInput, type SimWorld } from '../../../../../../src/sim/Simulation';
import { Scenario } from '../../../../../../src/sim/scenario';
import { FIXED_DT, FULL_BODY_VIEW_RANGE } from '../../../../../../src/game/constants';
import { GREYBOX_WORLD, BASE } from '../../../../../../src/world/worldData';
import type { WorldChunkDef } from '../../../../../../src/world/chunks';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

function t23World(withPresence: boolean): SimWorld {
  const basin: WorldChunkDef = {
    id: 't23-basin',
    band: 5,
    bounds: { x: 6400, y: -2400, w: 13600, h: 2000 },
    terrain: [
      {
        id: 't23-floor',
        closed: true,
        points: [vec2(6400, -4400), vec2(20000, -4400), vec2(20000, -4100), vec2(6400, -4100)],
      },
      {
        id: 't23-east-wall',
        closed: true,
        points: [vec2(20000, -2400), vec2(20300, -2400), vec2(20300, -4400), vec2(20000, -4400)],
      },
    ],
    exits: [{ id: 't23-to-seabed', to: 'seabed', position: vec2(6600, -2200) }],
    creatureSpawns: [
      ...(withPresence ? [{ id: 't23-crossing', creature: 'T-23', position: vec2(12800, -3400), count: 1 }] : []),
      { id: 't23-congregation', creature: 'T-03', position: vec2(12300, -3500), count: 4 },
      { id: 't23-drifters', creature: 'T-06', position: vec2(11700, -3600), count: 3 },
    ],
  };
  return { chunks: [...GREYBOX_WORLD, basin], base: BASE, currentFields: [] };
}

function dive(sc: Scenario): void {
  sc.swimTo(vec2(5700, -1600), 60, 20000);
  sc.swimTo(vec2(7000, -3300), 60, 20000);
  sc.swimTo(vec2(10000, -3400), 40, 20000);
  sc.swimTo(vec2(10800, -3400), 40, 20000);
}

function run(withPresence: boolean): void {
  const sc = new Scenario(441, t23World(withPresence));
  const drifters = sc.sim.creatures.filter((c) => c.def.id === 'T-06');
  const t23 = withPresence ? sc.sim.creatures.find((c) => c.def.id === 'T-23') : null;
  dive(sc);
  const arrival = sc.time;
  const laneX = 12800;
  const d0 = t23 ? dist(t23.position, sc.sim.player.position) : Math.abs(laneX - sc.sim.player.position.x);
  const drifterX0 = Math.min(...drifters.map((c) => c.position.x));

  let tAnnounce = -1;
  let tReact = -1;
  let tVisual = -1;
  let tHeartbeat = -1;
  let cleanViewAt = -1;
  let ended = false;
  const total = Math.round(150 / FIXED_DT);
  for (let i = 0; i < total && !ended; i += 1) {
    sc.step(emptyInput());
    if (t23 === null) continue;
    const d = dist(t23.position, sc.sim.player.position);
    if (tAnnounce < 0 && d < 2400) tAnnounce = sc.time;
    if (tVisual < 0 && d <= FULL_BODY_VIEW_RANGE) tVisual = sc.time;
    for (const e of sc.sim.creatureAudioEvents) {
      if (e.creatureId === 'T-23' && tHeartbeat < 0) tHeartbeat = sc.time;
    }
    if (cleanViewAt < 0 && sc.sim.hasCleanFullBody(t23)) cleanViewAt = sc.time;
    if (tAnnounce > 0 && tReact < 0 && tVisual < 0) {
      if (drifters.some((c) => c.position.x < drifterX0 - 50)) tReact = sc.time;
    }
    if (tVisual > 0 && d > 2400) ended = true;
  }
  const moved = drifters.some((c) => c.position.x < drifterX0 - 50);
  const minDrifterX = Math.min(...drifters.map((c) => c.position.x));
  console.log(`[${withPresence ? 'A: with T-23' : 'B: without T-23'}]`);
  console.log(`  player arrival at (10800,-3400) t=${arrival.toFixed(2)}s, dist to lane start ${d0.toFixed(0)}`);
  console.log(`  drifter min-x start ${drifterX0.toFixed(0)} -> end ${minDrifterX.toFixed(0)} (moved >50 west: ${moved})`);
  if (withPresence) {
    console.log(`  tAnnounce=${tAnnounce < 0 ? 'never' : tAnnounce.toFixed(2)}`);
    console.log(`  tReact=${tReact < 0 ? 'never' : tReact.toFixed(2)}`);
    console.log(`  tVisual=${tVisual < 0 ? 'never' : tVisual.toFixed(2)}`);
    console.log(`  tHeartbeat=${tHeartbeat < 0 ? 'never' : tHeartbeat.toFixed(2)}`);
    console.log(`  cleanViewAt=${cleanViewAt < 0 ? 'never' : cleanViewAt.toFixed(2)} (expect never)`);
    console.log(
      `  order tReact<tVisual: ${tReact > 0 && tReact < tVisual ? 'YES' : 'NO'}, ` +
        `tReact<tHeartbeat: ${tReact > 0 && tHeartbeat > 0 && tReact < tHeartbeat ? 'YES' : 'NO'}, ` +
        `sight-head-start: ${tVisual > 0 ? (tVisual - tAnnounce).toFixed(2) + 's' : 'n/a'}`,
    );
  }
}

run(true);
run(false);
