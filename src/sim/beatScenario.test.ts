/**
 * Tests — the five authored spectacle beats (WI-04a, request §11.4, §36, §67):
 *   each beat is a data-driven `EncounterTrigger` in the production world
 *   data (internal slot ids enc-beat-s1..s5, request §0/§68), staged around
 *   the stable roster organism ids at the slots the private reveal map
 *   assigns (S1..S5). Each scenario drives the REAL production simulation
 *   from a fresh save (no mocks, no noclip, request §70) along the authored
 *   descent route, and asserts: the trigger fires inside its authored timing
 *   window (not before, not late), the entrance action ran (the organism
 *   repositioned / the camera state in the sim), the environmental reaction
 *   is present in the sim state (ambient params + audio cue), the completion
 *   story flag is set (the gate the reaction layer reads), and the escape
 *   path is physically traversable to a safe region without noclip. Plus the
 *   `once` semantics (re-entering the region does not re-fire) and full-run
 *   determinism (same seed, same beat order and timing).
 *
 * Route note: the hadal strip is a thin channel (depth 9600-9700) with a
 * pocket ledge overhanging its west end (x 18550-19000) and an interior room
 * in its middle (x 20100-22700). The authored descent enters the strip at
 * x ~19200 (east of the ledge), travels east along it, and the escape
 * retraces the path west and up through the twilight floor gap.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../util/math';
import { makeSimWorld, Simulation } from './Simulation';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { BASE } from '../world/worldData';
import type { Creature } from '../creatures/Creature';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The first live creature of a roster id (the spawn-order instance a move action targets). */
const firstOf = (sim: Simulation, id: string): Creature => sim.creatures.find((c) => c.def.id === id)!;

/**
 * The authored descent route (request §4.2 wide descending network), open
 * water only. The deep legs (W6-W8) stay east of the hadal pocket ledge so
 * the strip entry is a clear vertical drop; the beats fire in s1..s5 order
 * along this route (s1 shelf entry, s2 depth 9300, s3 depth 9620, s4 depth
 * 9650, s5 the approach to the east-end organism).
 */
const ROUTE: readonly Vec2[] = [
  vec2(5600, -2200), // W0 the coast-to-shelf descent gap
  vec2(7000, -3500), // W1 the shelf light staging (s1)
  vec2(9500, -5000), // W2 the shelf-to-twilight gap
  vec2(11500, -6500), // W3 twilight transit
  vec2(14500, -7800), // W4 the twilight floor gap (the safe region)
  vec2(15800, -9400), // W5 the abyss descent, crossing the s2 depth line
  vec2(19200, -9500), // W6 risen east of the hadal west wall, above the strip (the clear drop)
  vec2(19200, -9680), // W7 the strip drop, crossing the s3 + s4 depth lines (floor caps the depth)
  vec2(21800, -9650), // W8 the east end, inside the approach radius (s5)
];

/** The safe region the deep beats escape to: the twilight floor gap, clear water. */
const SAFE: Vec2 = vec2(14500, -7800);

/**
 * The realistic dive prep (request §53): harvest salvage nodes, bank at the
 * base, and craft the oxygen tank so the deep route fits the dive time. Real
 * mechanics only — harvesting, banking, crafting — no free resources. Bank
 * after every node so cargo frees up.
 */
function prepDive(sc: Scenario): void {
  for (const id of ['salvage-1', 'salvage-2', 'salvage-3']) {
    sc.swimTo(sc.findNodePosition(id)!, 40, 6000);
    const input = emptyInput();
    input.interact = true;
    sc.stepFor(0.5, input);
    sc.swimTo(BASE.position, 60, 6000);
  }
  const o2Before = sc.sim.player.o2Max;
  const craft = emptyInput();
  craft.craftRequest = 'tank-1';
  sc.assert(sc.sim.handleCraft(craft).crafted, 'the dive prep crafted the oxygen tank');
  sc.assert(sc.sim.player.o2Max === o2Before + 65, 'the tank extended the dive time');
}

/** Swim the authored route to (and including) waypoint `upTo`. */
function diveTo(sc: Scenario, upTo: number): void {
  for (let i = 0; i <= upTo; i += 1) sc.swimTo(ROUTE[i]!, 40, 6000);
}

/**
 * The deep-beat escape (the entry path in reverse): rise above the strip at
 * the clear drop (x ~19200), then up through the abyss and the twilight floor
 * gap to the safe region. Pure steering + collision — no noclip (request §70).
 * `fromEast` first retraces west along the strip to the clear drop.
 */
function escapeDeep(sc: Scenario, fromEast: boolean): void {
  if (fromEast) sc.swimTo(ROUTE[7]!, 40, 6000);
  sc.swimTo(ROUTE[6]!, 40, 6000);
  sc.swimTo(SAFE, 40, 6000);
  sc.assertNear(sc.sim.player.position, SAFE, 150, 'the escape path is traversable to a safe region without noclip');
  sc.assert(sc.sim.player.o2 > 0 && sc.sim.player.health > 0, 'the player survived the full trip');
}

describe('the five authored spectacle beats in the production world (WI-04a)', () => {
  it('the production world data carries five once-firing beats, each with entrance + environmental reaction + completion flag, and no locked paths', () => {
    const triggers = makeSimWorld().chunks.flatMap((c) => c.triggers ?? []);
    const beats = triggers.filter((t) => t.id.startsWith('enc-beat-'));
    expect(beats.map((b) => b.id)).toEqual(['enc-beat-s1', 'enc-beat-s2', 'enc-beat-s3', 'enc-beat-s4', 'enc-beat-s5']);
    for (const b of beats) {
      expect(b.once, `${b.id} must fire at most once`).toBe(true);
      const actions = b.actions.map((a) => a.type);
      // The completion flag (the gate the reaction layer reads).
      const flag = b.actions.find((a) => a.type === 'setStoryFlag');
      expect(flag, `${b.id} must set a completion story flag`).toBeDefined();
      expect(flag!.type === 'setStoryFlag' ? flag!.flag : '').toBe(`beat-${b.id.slice(-2)}`);
      // An entrance action (organism movement or camera framing) and an
      // environmental reaction (audio / ambient / entity).
      expect(
        actions.includes('moveBackgroundCreature') || actions.includes('camera'),
        `${b.id} needs an entrance action`,
      ).toBe(true);
      expect(
        actions.includes('playAudio') || actions.includes('alterAmbient') || actions.includes('despawnEntity') || actions.includes('spawnEntity'),
        `${b.id} needs an environmental reaction action`,
      ).toBe(true);
      // Escape is guaranteed by the authored open path: no beat locks a path.
      expect(actions.includes('lockPath'), `${b.id} must not lock a path`).toBe(false);
    }
  });

  it('beat s1 (shelf): the light procession fires on first entry, the entrance ran, the reaction is present, the flag is set, and re-entering does not re-fire', () => {
    const sc = new Scenario(51);
    const light = firstOf(sc.sim, 'T-03');
    const driver = firstOf(sc.sim, 'T-09');
    const lightX0 = light.position.x;
    const driverY0 = driver.position.y;
    prepDive(sc);
    // After the prep the player is at the base (the coast band), not the shelf.
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s1'), 'the beat must not fire before the player enters the shelf region');
    sc.swimTo(ROUTE[1]!, 40, 6000);
    sc.assert(sc.sim.triggers.firedIds.has('enc-beat-s1'), 'the beat fires inside its authored timing window (shelf entry)');
    sc.assert(sc.sim.storyFlags.includes('beat-s1'), 'the completion story flag is set');
    // Entrance: the lights break off west, against the east drift; the driver
    // stages up from below. Each organism is repositioned to its authored spot.
    sc.assert(light.position.x <= lightX0 - 300, `the light procession moved against the drift (dx=${(light.position.x - lightX0).toFixed(0)})`);
    sc.assert(dist(light.position, vec2(8500, -3500)) < 450, 'the lights repositioned to the authored staging spot');
    sc.assert(driver.position.y >= driverY0 + 300, `the driver staged up from below (dy=${(driver.position.y - driverY0).toFixed(0)})`);
    sc.assert(dist(driver.position, vec2(11000, -4800)) < 450, 'the driver repositioned to the authored staging spot');
    // Environmental reaction in the sim state.
    sc.assert(sc.sim.triggerState.audioCues.includes('beat-s1-lights'), 'the audio cue is present in the sim');
    sc.assert((sc.sim.triggerState.ambient.dim ?? 1) < 1, 'the ambient darkening is present in the sim');
    // Escape: back through the shelf notch to the coast band (no noclip). The
    // shelf west wall (x 4600-5000) blocks a direct west swim, so the player
    // ascends through the seabed notch (x 5000-6400) first.
    sc.swimTo(vec2(5600, -2400), 40, 6000);
    sc.swimTo(vec2(5600, -1000), 40, 6000);
    sc.swimTo(BASE.position, 50, 6000);
    sc.assertNear(sc.sim.player.position, BASE.position, 80, 'the escape path back to the coast is traversable without noclip');
    // once semantics: re-entering the shelf region does not re-fire the beat.
    const cuesBefore = sc.sim.triggerState.audioCues.length;
    const flagsBefore = sc.sim.storyFlags.length;
    sc.swimTo(ROUTE[1]!, 40, 6000);
    sc.assert(sc.sim.triggerState.audioCues.length === cuesBefore, 're-entering the region does not re-play the cue');
    sc.assert(sc.sim.storyFlags.length === flagsBefore, 're-entering the region does not re-set the flag');
  }, 60000);

  it('beat s2 (deep descent): the structure beat fires at its depth line, the authored shift ran, and the escape returns to the safe region', () => {
    const sc = new Scenario(52);
    const structure = firstOf(sc.sim, 'T-22');
    const x0 = structure.position.x;
    prepDive(sc);
    diveTo(sc, 4);
    sc.assert(sc.sim.player.depth < 9300, 'the route holds above the beat depth before the descent');
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s2'), 'the beat must not fire above its authored depth line');
    sc.swimTo(ROUTE[5]!, 40, 6000);
    sc.assert(sc.sim.triggers.firedIds.has('enc-beat-s2'), 'the beat fires at its authored depth line');
    sc.assert(sc.sim.storyFlags.includes('beat-s2'), 'the completion story flag is set');
    sc.assert(sc.sim.triggerState.audioCues.includes('beat-s2-creak'), 'the creak cue is present in the sim');
    sc.assert((sc.sim.triggerState.ambient.dim ?? 1) <= 0.75, 'the ambient darkening is present in the sim');
    // Entrance: the authored west shift (against the east drift) is in place.
    sc.assert(structure.position.x <= x0 - 300, `the structure shifted west, against the current (dx=${(structure.position.x - x0).toFixed(0)})`);
    // Escape: up the descent to the safe region.
    escapeDeep(sc, false);
  }, 60000);

  it('beat s3 (strip entry): the wide framing + pulse reaction fire at its depth line, after the s2 beat', () => {
    const sc = new Scenario(53);
    prepDive(sc);
    diveTo(sc, 6);
    sc.assert(sc.sim.player.depth < 9550, 'the route holds above the beat depth line before the drop');
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s3'), 'the beat must not fire above its authored depth line');
    // Drop to between the s3 and s4 depth lines so only s3 fires here (the
    // s4 beat would overwrite the camera state).
    sc.swimTo(vec2(19200, -9600), 40, 6000);
    sc.assert(sc.sim.triggers.firedIds.has('enc-beat-s3'), 'the beat fires at its authored depth line (the s3 line)');
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s4'), 's4 has not fired above its depth line');
    sc.assert(sc.sim.storyFlags.includes('beat-s3'), 'the completion story flag is set');
    sc.assert(sc.sim.triggerState.cameraModifier === 'wide', 'the camera modifier is present in the sim');
    sc.assert(sc.sim.triggerState.audioCues.includes('beat-s3-pulse'), 'the pulse cue is present in the sim');
    sc.assert((sc.sim.triggerState.ambient.surge ?? 1) > 1, 'the ambient surge is present in the sim');
    // The authored beat order holds: s2 preceded s3.
    sc.assert(sc.sim.storyFlags.indexOf('beat-s2') < sc.sim.storyFlags.indexOf('beat-s3'), 's2 fired before s3');
    // Escape: up the descent to the safe region.
    escapeDeep(sc, false);
  }, 60000);

  it('beat s4 (strip entry): the tight framing + heartbeat reaction fire at its depth line, after the s3 beat', () => {
    const sc = new Scenario(54);
    prepDive(sc);
    diveTo(sc, 6);
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s3'), 's3 not yet fired above its depth line');
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s4'), 's4 not yet fired above its depth line');
    sc.swimTo(ROUTE[7]!, 40, 6000);
    sc.assert(sc.sim.triggers.firedIds.has('enc-beat-s4'), 'the beat fires at its authored depth line (strip entry)');
    sc.assert(sc.sim.storyFlags.includes('beat-s4'), 'the completion story flag is set');
    sc.assert(sc.sim.triggerState.cameraModifier === 'tight', 'the camera modifier is present in the sim');
    sc.assert(sc.sim.triggerState.audioCues.includes('beat-s4-heartbeat'), 'the heartbeat cue is present in the sim');
    sc.assert((sc.sim.triggerState.ambient.dim ?? 1) <= 0.6, 'the ambient darkening is present in the sim');
    // The authored beat order holds: s3 preceded s4.
    sc.assert(sc.sim.storyFlags.indexOf('beat-s3') < sc.sim.storyFlags.indexOf('beat-s4'), 's3 fired before s4');
    // Escape: up the descent to the safe region.
    escapeDeep(sc, false);
  }, 60000);

  it('beat s5 (east end): the plate-cluster beat fires within its approach radius, the cluster crosses, the pullback is set, and the escape returns to the safe region', () => {
    const sc = new Scenario(55);
    const cluster = firstOf(sc.sim, 'T-25');
    const clusterX0 = cluster.position.x;
    prepDive(sc);
    diveTo(sc, 7);
    sc.assert(!sc.sim.triggers.firedIds.has('enc-beat-s5'), 'the beat must not fire before the player approaches the cluster');
    // The final leg, stepped so the fire moment is observable.
    for (let i = 0; i < 6000; i += 1) {
      sc.step(sc.steerToward(ROUTE[8]!, 40));
      if (sc.sim.triggers.firedIds.has('enc-beat-s5')) break;
    }
    sc.assert(sc.sim.triggers.firedIds.has('enc-beat-s5'), 'the beat fires inside its authored approach radius');
    sc.assert(dist(cluster.position, sc.sim.player.position) <= 1200, 'the fire moment is at the approach, not far away');
    sc.assert(sc.sim.storyFlags.includes('beat-s5'), 'the completion story flag is set');
    sc.assert(sc.sim.triggerState.cameraModifier === 'pullback', 'the camera pullback is present in the sim');
    sc.assert(sc.sim.triggerState.audioCues.includes('beat-s5-plates'), 'the clink cue is present in the sim');
    sc.assert((sc.sim.triggerState.ambient.surge ?? 1) >= 1.8, 'the ambient surge is present in the sim');
    // Entrance: the cluster crossed west, against the east drift.
    sc.assert(cluster.position.x <= clusterX0 - 300, `the cluster crossed west (dx=${(cluster.position.x - clusterX0).toFixed(0)})`);
    // Escape: west along the strip, then up to the safe region.
    escapeDeep(sc, true);
  }, 60000);

  it('full run, same seed: the same beat order and timing twice (determinism)', () => {
    const run = (): { id: string; time: number }[] => {
      const sc = new Scenario(42);
      const fired: { id: string; time: number }[] = [];
      const seen = new Set<string>();
      prepDive(sc);
      diveTo(sc, 8);
      for (let i = 0; i < 300; i += 1) {
        sc.step(emptyInput());
        for (const id of sc.sim.triggers.firedIds) {
          if (!seen.has(id)) {
            seen.add(id);
            fired.push({ id, time: Math.round(sc.time * 1000) / 1000 });
          }
        }
      }
      return fired.filter((f) => f.id.startsWith('enc-beat-'));
    };
    const first = run();
    const second = run();
    expect(first.map((f) => f.id)).toEqual(['enc-beat-s1', 'enc-beat-s2', 'enc-beat-s3', 'enc-beat-s4', 'enc-beat-s5']);
    expect(second, 'same seed must give the same beat order and timing').toEqual(first);
    expect(first, 'all five beats fired during the run').toHaveLength(5);
  }, 120000);
});
