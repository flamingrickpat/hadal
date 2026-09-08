/**
 * Reviewer probes (WI-02c) — independent causality checks on the ecology
 *   layer. Each probe runs the production `Simulation` through the existing
 *   `Scenario` harness (seed 42, 9 s) with one element of the implementer's
 *   scenario switched off, so a passing pair proves the observed behavior is
 *   caused by that element (the bus signal), not by layout drift or wander.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from 'C:/Temp/hadal-v2/src/util/math';
import { emptyInput, type SimWorld } from 'C:/Temp/hadal-v2/src/sim/Simulation';
import { Scenario } from 'C:/Temp/hadal-v2/src/sim/scenario';
import { driftField } from 'C:/Temp/hadal-v2/src/systems/CurrentSystem';
import { GREYBOX_WORLD, BASE } from 'C:/Temp/hadal-v2/src/world/worldData';
import type { CreatureSpawnDef } from 'C:/Temp/hadal-v2/src/world/chunks';

const PRED_START: Vec2 = vec2(2200, -400);
const KILL_SITE: Vec2 = vec2(3000, -600);
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

interface Run {
  minToSite: number;
  maxPredDisplacement: number;
  maxSchoolFromPred: number; // distance from the predator's LIVE position (phantom-at-spawn if absent)
  final: Vec2[];
}

function world(withPredator: boolean): SimWorld {
  const spawns: readonly CreatureSpawnDef[] = [
    { id: 'school-1', creature: 'fixture-schooler', position: vec2(1600, -1000), count: 3 },
    { id: 'victim-1', creature: 'fixture-forager', position: vec2(2050, -400), count: 1 },
    ...(withPredator
      ? [{ id: 'pred-1', creature: 'fixture-predator', position: PRED_START, count: 1 }]
      : []),
    { id: 'scavenge-1', creature: 'fixture-scavenger', position: vec2(2500, -900), count: 1 },
    { id: 'feed-1', creature: 'fixture-feeder', position: vec2(3200, -900), count: 1 },
  ];
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return {
    chunks,
    base: BASE,
    currentFields: [driftField({ x: 3000, y: -1200, w: 1000, h: 800 }, vec2(1, 1), 10)],
  };
}

function run(seed: number, killSignal: boolean, quietSignal: boolean, withPredator: boolean): Run {
  const sc = new Scenario(seed, world(withPredator));
  if (killSignal) sc.sim.scheduleSignal(3.0, { type: 'noise', pos: KILL_SITE, strength: 1.0, tag: 'kill' });
  if (quietSignal) sc.sim.scheduleSignal(4.0, { type: 'noise', pos: vec2(1300, -100), strength: 1.0, tag: 'quiet' });

  const out: Run = { minToSite: Infinity, maxPredDisplacement: 0, maxSchoolFromPred: 0, final: [] };
  const sample = () => {
    const livePred = sc.sim.creatures.find((c) => c.def.id === 'fixture-predator');
    const predPos = livePred ? livePred.position : PRED_START;
    for (const c of sc.sim.creatures) {
      const p = vec2(c.position.x, c.position.y);
      if (c.def.id === 'fixture-scavenger') out.minToSite = Math.min(out.minToSite, dist(p, KILL_SITE));
      if (c.def.id === 'fixture-predator') out.maxPredDisplacement = Math.max(out.maxPredDisplacement, dist(p, PRED_START));
      if (c.def.id === 'fixture-schooler') out.maxSchoolFromPred = Math.max(out.maxSchoolFromPred, dist(p, predPos));
    }
  };

  sc.step({ ...emptyInput(), useTool: true });
  for (let i = 0; i < 17; i += 1) {
    sc.stepFor(0.5, emptyInput());
    sample();
  }
  for (const c of sc.sim.creatures) out.final.push(vec2(c.position.x, c.position.y));
  out.final.sort((a, b) => a.x - b.x || a.y - b.y);
  return out;
}

describe('reviewer adversarial probes (WI-02c)', () => {
  it('scavenger closes on the kill site only when the kill signal is on the bus', () => {
    const withKill = run(42, true, false, false);
    const noKill = run(42, false, false, false);
    expect(withKill.minToSite, `with kill: ${withKill.minToSite.toFixed(1)}u`).toBeLessThan(433);
    expect(noKill.minToSite, `no kill: ${noKill.minToSite.toFixed(1)}u`).toBeGreaterThan(483);
  });

  it('quiet signal shrinks the predator max displacement', () => {
    const withQuiet = run(42, true, true, true);
    const noQuiet = run(42, true, false, true);
    expect(
      withQuiet.maxPredDisplacement,
      `quiet: ${withQuiet.maxPredDisplacement.toFixed(1)}u vs free ${noQuiet.maxPredDisplacement.toFixed(1)}u`,
    ).toBeLessThan(0.8 * noQuiet.maxPredDisplacement);
  });

  it('school flee is caused by the predator signal, not by layout drift', () => {
    // Measured (seed 42, this world): with predator the farthest schooler
    // reaches ~1047u from the predator's live position; in the
    // predator-free control the school only idles, staying within ~912u of
    // the phantom-at-spawn. The >1000u growth is the flee reaction.
    const withPred = run(42, false, false, true);
    expect(withPred.maxSchoolFromPred, `with predator: ${withPred.maxSchoolFromPred.toFixed(1)}u`).toBeGreaterThan(1000);
    const noPred = run(42, false, false, false);
    expect(noPred.maxSchoolFromPred, `no predator: ${noPred.maxSchoolFromPred.toFixed(1)}u`).toBeLessThan(930);
  });

  it('same seed is deterministic; different seed diverges', () => {
    const a = run(42, true, true, true);
    const b = run(42, true, true, true);
    expect(a.final.map((p) => [Math.round(p.x), Math.round(p.y)])).toEqual(
      b.final.map((p) => [Math.round(p.x), Math.round(p.y)]),
    );
    const c = run(7, true, true, true);
    expect(c.final.map((p) => [Math.round(p.x), Math.round(p.y)])).not.toEqual(
      a.final.map((p) => [Math.round(p.x), Math.round(p.y)]),
    );
  });
});
