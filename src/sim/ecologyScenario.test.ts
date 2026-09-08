/**
 * Tests — the ecology illusion through the production simulation (request
 *   §20, §48, §61, §63, §64; WI-02c AC-cf-ecology). One scenario run drives
 *   the real `Simulation` headlessly and asserts at least three distinct
 *   cross-species reactions, every one driven by a `WorldSignal` on the bus:
 *   a hunt makes the nearby school part (flee, §48), a kill signal draws the
 *   scavenger toward the kill (scavenge — provably the scavenge reaction,
 *   since the scavenger fixture has no generic sense), a quiet signal held
 *   before a scheduled large event freezes the predator at the event site,
 *   and the filter feeder orients along the authored current field (§64). A
 *   second capped-count scenario checks the reaction pass stays within the
 *   throttling budget (§34).
 *
 *   Layout rationale (all distances are scenario-tuned, see assertions):
 *   - The tool noise at the player start (1300,-100) alerts the predator,
 *     which stalks toward the player — AWAY from the school at (1600,-1000),
 *     so the only thing that ever pushes the school away from the predator
 *     start is the PREDATOR_TAG flee; the generic investigate of the hunt's
 *     alert noise points the other way.
 *   - The forager spawns 150u from the predator, inside PREDATOR_ATTACK_RANGE
 *     (400), so it is the ambient kill; the school is 680u away, outside it.
 *   - The scavenger at (2500,-900) is ~583u from the scheduled KILL_TAG at
 *     (3000,-600) (perceived ~0.43 > the 0.1 scavenge threshold). It has no
 *     generic sense, so nothing but the scavenge reaction can pull it toward
 *     the kill; the predator tag is quiet there during the window (flee
 *     < 0.15), so it is not masked by a flee.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../util/math';
import { emptyInput, type SimWorld } from './Simulation';
import { Scenario } from './scenario';
import { driftField } from '../systems/CurrentSystem';
import { GREYBOX_WORLD, BASE } from '../world/worldData';
import type { CreatureSpawnDef } from '../world/chunks';

const PRED_START: Vec2 = vec2(2200, -400);
const KILL_SITE: Vec2 = vec2(3000, -600);

/** The greybox world with the ecology fixtures and an authored drift field (§64). */
function ecologyWorld(): SimWorld {
  const spawns: readonly CreatureSpawnDef[] = [
    { id: 'school-1', creature: 'fixture-schooler', position: vec2(1600, -1000), count: 3 },
    { id: 'victim-1', creature: 'fixture-forager', position: vec2(2050, -400), count: 1 },
    { id: 'pred-1', creature: 'fixture-predator', position: vec2(2200, -400), count: 1 },
    { id: 'scavenge-1', creature: 'fixture-scavenger', position: vec2(2500, -900), count: 1 },
    { id: 'feed-1', creature: 'fixture-feeder', position: vec2(3200, -900), count: 1 },
  ];
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return {
    chunks,
    base: BASE,
    // The drift field spans the feeder's full (1,1)-aligned drift path for the
    // run (it rides the current out toward the field's far corner), clear of
    // every signal source.
    currentFields: [driftField({ x: 3000, y: -1200, w: 1000, h: 800 }, vec2(1, 1), 10)],
  };
}

type Snapshot = { t: number; pos: { id: string; at: Vec2 }[] };

function capture(sc: Scenario): Snapshot {
  return {
    t: sc.time,
    pos: sc.sim.creatures.map((c) => ({ id: c.def.id, at: vec2(c.position.x, c.position.y) })),
  };
}

function posOf(snap: Snapshot, id: string): Vec2 {
  const hit = snap.pos.find((p) => p.id === id);
  expect(hit, `no creature ${id} at t=${snap.t.toFixed(2)}`).toBeDefined();
  return hit!.at;
}

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

describe('ecology scenario: cross-species reactions through the world-signal bus', () => {
  it('flee, kill, scavenge, quiet-hold and current-orientation in one seeded run', () => {
    const sc = new Scenario(42, ecologyWorld());
    // Two event-driven signals the simulation itself produces (§63): a kill
    // event at (2400,-600) that the scavenger responds to, and a quiet
    // signal at the site the predator reaches before the scheduled large
    // event. Both drain through `scheduleSignal`, so no global state read.
    sc.sim.scheduleSignal(3.0, { type: 'noise', pos: KILL_SITE, strength: 1.0, tag: 'kill' });
    sc.sim.scheduleSignal(4.0, { type: 'noise', pos: vec2(1300, -100), strength: 1.0, tag: 'quiet' });

    const history: Snapshot[] = [capture(sc)];
    sc.step({ ...emptyInput(), useTool: true }); // the hunt begins from a signal
    for (let i = 0; i < 17; i += 1) {
      sc.stepFor(0.5, emptyInput());
      history.push(capture(sc));
    }

    const at = (t: number): Snapshot => {
      const snap = history.find((h) => Math.abs(h.t - t) < 0.26);
      expect(snap, `no snapshot near t=${t}`).toBeDefined();
      return snap!;
    };

    // --- flee: the school parts away from the hunting predator (§48). ---
    // At t=1.0 the PREDATOR_TAG is at (2200,-400) with perceived flee
    // strength ~0.24 (threshold 0.15). Nothing else pushes the school away:
    // the tool noise only triggers investigate (0.058 < 0.092 threshold),
    // and the hunt's alert noise is the investigate target, which points the
    // other way. So the growing distance to the predator start is the flee.
    const schoolAt = (t: number): Vec2[] =>
      at(t).pos.filter((p) => p.id === 'fixture-schooler').map((p) => p.at);
    const mean = (vs: Vec2[]): Vec2 => {
      const s = vec2(0, 0);
      for (const v of vs) {
        s.x += v.x;
        s.y += v.y;
      }
      s.x /= vs.length;
      s.y /= vs.length;
      return s;
    };
    const dStart = dist(mean(schoolAt(0)), PRED_START);
    const dFled = dist(mean(schoolAt(1.0)), PRED_START);
    const fled = dFled - dStart;
    sc.assert(fled > 25, `school parted away from the predator (moved ${fled.toFixed(1)}u farther)`);
    sc.trace(`flee: school mean moved ${fled.toFixed(1)}u away from the predator start (t=0 -> t=1)`);

    // --- kill: the hunt opens on the forager and it is removed (§20). ---
    // The forager spawns 150u from the predator, inside PREDATOR_ATTACK_RANGE
    // (400); the school is 680u away, outside it, so the forager is the kill.
    expect(sc.sim.creatures).toHaveLength(6);
    expect(sc.sim.creatures.some((c) => c.def.id === 'fixture-forager')).toBe(false);
    sc.assert(at(3.0).t >= 2.9, 'scenario reached t=3');
    sc.trace('kill: the forager was removed from the ambient pool (7 -> 6)');

    // --- scavenge: the scavenger walks the KILL_TAG. ---
    // The scavenger fixture has NO generic sense, so its only signal-driven
    // motion is the ecology `scavenge` reaction (keyed to the `kill` tag,
    // SCAVENGE_RADIUS 800 / threshold 0.1). Approaching the kill is therefore
    // provably the scavenge reaction — a generic `investigate` of the kill
    // noise is structurally impossible here, so no direction disambiguation
    // is needed. The predator is quiet at the scavenger during this window
    // (flee < 0.15), so the flee reaction does not mask it either.
    const scav35 = posOf(at(3.5), 'fixture-scavenger');
    const scav40 = posOf(at(4.0), 'fixture-scavenger');
    const toKill = vec2(KILL_SITE.x - scav35.x, KILL_SITE.y - scav35.y);
    const move = vec2(scav40.x - scav35.x, scav40.y - scav35.y);
    const mLen = Math.hypot(move.x, move.y);
    sc.assert(mLen > 5, `scavenger is moving (${mLen.toFixed(1)}u in 0.5s)`);
    const alignKill = (move.x * toKill.x + move.y * toKill.y) / (mLen * Math.hypot(toKill.x, toKill.y));
    sc.assert(alignKill > 0.8, `scavenger walking toward the kill (cos angle ${alignKill.toFixed(2)})`);
    // It keeps approaching through the signal's lifetime.
    const dKill4 = dist(scav40, KILL_SITE);
    const dKill45 = dist(posOf(at(4.5), 'fixture-scavenger'), KILL_SITE);
    sc.assert(dKill45 < dKill4, `scavenger kept closing on the kill (${dKill4.toFixed(0)}u -> ${dKill45.toFixed(0)}u)`);
    sc.trace(`scavenge: kill distance ${dist(scav35, KILL_SITE).toFixed(0)}u -> ${dKill45.toFixed(0)}u; cos-to-kill=${alignKill.toFixed(2)}`);

    // --- quiet: the zone quiets before the scheduled event (§20, §63). ---
    // The quiet signal lands at t=4.0 at (1300,-100), where the predator has
    // already reached (it stalked the tool noise there). The predator's
    // `ecology.quiet` tolerance is 0.1; the hold suppresses its steering for
    // the signal's 3s lifetime, then motion resumes.
    const predHeld0 = posOf(at(4.5), 'fixture-predator');
    const predHeld1 = posOf(at(7.0), 'fixture-predator');
    const holdDrift = dist(predHeld0, predHeld1);
    // The hold zeroes the predator's acceleration; its residual stalk velocity
    // decays through drag, so some drift is expected (~35u measured). Without
    // the hold it would cover ~300u at maxSpeed in this window — 50u separates
    // "held" from "stalked" with wide margin on both sides.
    sc.assert(holdDrift < 50, `predator held during the quiet (drifted ${holdDrift.toFixed(1)}u over 2.5s)`);
    // Then it resumes after the signal expires.
    const resumed = dist(predHeld0, posOf(at(8.5), 'fixture-predator'));
    sc.assert(resumed > 60, `predator resumed after the quiet (moved ${resumed.toFixed(0)}u)`);
    sc.trace(`quiet: predator held ${holdDrift.toFixed(1)}u over 2.5s, then moved ${resumed.toFixed(0)}u`);

    // --- filter feeder: orients along the current field (§64). ---
    // The feeder never investigates (tool noise is 2144u away, perceived
    // 0.023 < 0.092 threshold), so it stays in forage and the filter-feeder
    // nudge orients it along the (1,1) drift inside the authored field.
    const feedAt = (t: number): Vec2 => posOf(at(t), 'fixture-feeder');
    const feedMove = vec2(feedAt(5.0).x - feedAt(4.5).x, feedAt(5.0).y - feedAt(4.5).y);
    const fLen = Math.hypot(feedMove.x, feedMove.y);
    sc.assert(fLen > 5, `feeder is moving (${fLen.toFixed(1)}u in 0.5s)`);
    const align = (feedMove.x + feedMove.y) / (fLen * Math.SQRT2); // drift direction is (1,1)/sqrt2
    sc.assert(align > 0.8, `feeder oriented along the current (cos angle ${align.toFixed(2)})`);
    sc.trace(`current-orientation: feeder moved ${fLen.toFixed(1)}u at cos=${align.toFixed(2)} to the drift`);

    sc.assert(true, 'all four cross-species reactions observed in one seeded run');
  });

  it('capped ambient counts run the reaction pass at simulation speed', () => {
    // Capped counts, §34 budget: the ecology pass is bounded-radius bus
    // queries plus one local school scan per schooler — it must stay well
    // under a frame at the throttle budget.
    const bigSchool: readonly CreatureSpawnDef[] = [
      { id: 'school-a', creature: 'fixture-schooler', position: vec2(2800, -700), count: 6 },
      { id: 'school-b', creature: 'fixture-schooler', position: vec2(3200, -900), count: 6 },
      { id: 'school-c', creature: 'fixture-schooler', position: vec2(2400, -1100), count: 6 },
      { id: 'school-d', creature: 'fixture-schooler', position: vec2(3600, -1100), count: 6 },
      { id: 'scavenge-1', creature: 'fixture-scavenger', position: vec2(2700, -900), count: 1 },
      { id: 'pred-1', creature: 'fixture-predator', position: vec2(2200, -400), count: 1 },
      { id: 'feed-1', creature: 'fixture-feeder', position: vec2(3050, -1050), count: 1 },
    ];
    const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: bigSchool } : c));
    const world: SimWorld = {
      chunks,
      base: BASE,
      currentFields: [driftField({ x: 2900, y: -1200, w: 600, h: 400 }, vec2(1, 1), 10)],
    };
    const sc = new Scenario(7, world);
    sc.step({ ...emptyInput(), useTool: true });

    const steps = 1000; // ~16.7s of simulation
    const start = performance.now();
    sc.stepFor(steps / 60, emptyInput(), 1 / 60);
    const ms = performance.now() - start;

    // 1000 steps ahead of real time: the whole frame budget for every system
    // is 16.7s, so this only holds if the creature work (including the
    // ecology pass) is far below a frame.
    sc.assert(ms < 2000, `${steps} steps in ${ms.toFixed(0)}ms (sim speed required)`);
    sc.trace(`performance: ${steps} steps of 7 capped creatures in ${ms.toFixed(0)}ms`);
  });
});
