/**
 * Independent reviewer adversarial probe for WI-03c1b. Runs the production
 * Simulation (no mocks of the rules) at seeds/positions DIFFERENT from the
 * implementer's scenarios, to independently confirm the load-bearing claims:
 * (A) T-14 is a robust non-chase net that re-arms across repeated encounters
 *     and is recoverable (never lethal); (B) T-15 charges only on a loud
 *     corner (silent-close control never triggers it); (C) T-18 drives prey
 *     into a harvestable field and never attacks the player.
 */
import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../../../../../../src/util/math';
import { emptyInput, makeSimWorld, type SimWorld } from '../../../../../../src/sim/Simulation';
import { Scenario } from '../../../../../../src/sim/scenario';
import { FIXED_DT } from '../../../../../../src/game/constants';
import { BASE, GREYBOX_WORLD } from '../../../../../../src/world/worldData';
import type { CreatureSpawnDef } from '../../../../../../src/world/chunks';
import type { CreatureState } from '../../../../../../src/creatures/CreatureDef';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

function world(spawns: readonly CreatureSpawnDef[]): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields: [] };
}

const one = (sc: Scenario, id: string): (typeof sc.sim.creatures)[number] =>
  sc.sim.creatures.find((c) => c.def.id === id)!;

function run(sc: Scenario, c: (typeof sc.sim.creatures)[number], seen: Set<CreatureState>, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i += 1) {
    sc.step(emptyInput());
    seen.add(c.state);
  }
}

describe('reviewer adversarial probes (WI-03c1b)', () => {
  it('A: T-14 re-arms across repeated encounters, snaps recoverably, never chases', () => {
    const sc = new Scenario(7001, world([{ id: 'r-t14', creature: 'T-14', position: vec2(1700, -300) }]));
    const c = one(sc, 'T-14');
    const seen = new Set<CreatureState>();
    sc.sim.player.capabilities.add('sonar');
    let snaps = 0;
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const hp0 = sc.sim.player.health;
      sc.sim.teleportTo(1760, 300); // x=1760 depth=300 → (1760,-300), ~60u from the post
      sc.step({ ...emptyInput(), sonar: true });
      seen.add(c.state);
      sc.step({ ...emptyInput(), sonar: false });
      run(sc, c, seen, 4);
      if (sc.sim.player.health < hp0) snaps += 1;
      run(sc, c, seen, 12); // outlast the 10s snap reset before the next cycle
    }
    expect(seen.has('alert'), 'the post must arm (alert) at least once').toBe(true);
    expect(snaps, 'the net must snap at least once (recoverable damage)').toBeGreaterThanOrEqual(1);
    expect(sc.sim.player.health, 'the snap is recoverable, not lethal').toBeGreaterThan(0);
    for (const s of seen) expect(s, `T-14 never enters pursuit (${s})`).not.toMatch(/attack|stalk/);
  });

  it('B: T-15 never charges a silent corner; a loud corner does', () => {
    const sc = new Scenario(7002, world([{ id: 'r-t15', creature: 'T-15', position: vec2(1700, -300) }]));
    const c = one(sc, 'T-15');
    const silent = new Set<CreatureState>();
    // Silent corner: very close (40u) but no tool noise for 15s.
    sc.sim.teleportTo(1740, 300); // x=1740 depth=300 → (1740,-300), 40u from the organism
    run(sc, c, silent, 15);
    expect(silent.has('attack'), 'a silent corner must not trigger the charge').toBe(false);
    expect(sc.sim.player.health, 'a silent corner does no damage').toBe(100);
    // Loud corner: the same proximity plus tool noise triggers one charge.
    const loud = new Set<CreatureState>();
    sc.step({ ...emptyInput(), useTool: true });
    loud.add(c.state);
    sc.step({ ...emptyInput(), useTool: false });
    run(sc, c, loud, 3);
    expect(loud.has('attack'), 'a loud corner triggers the bounded charge').toBe(true);
    expect(sc.sim.player.health, 'the charge does damage').toBeLessThan(100);
  });

  it('C: T-18 drives prey into a field and never attacks the player', () => {
    const sc = new Scenario(7003, world([
      { id: 'r-t18', creature: 'T-18', position: vec2(1700, -300) },
      { id: 'r-t03a', creature: 'T-03', position: vec2(2100, -200) },
      { id: 'r-t03b', creature: 'T-03', position: vec2(2150, -300) },
      { id: 'r-t03c', creature: 'T-03', position: vec2(2100, -400) },
    ]));
    const c = one(sc, 'T-18');
    const seen = new Set<CreatureState>();
    run(sc, c, seen, 45);
    const field = sc.sim.creatures.filter((o) => o.def.id === 'T-03' && dist(o.position, c.position) <= 150);
    expect(field.length, 'prey are driven into the harvestable field').toBeGreaterThanOrEqual(1);
    expect(sc.sim.player.health, 'the herder never attacks the player').toBe(100);
    for (const s of seen) expect(s, 'the herder has no pursuit states').toBe('wander');
    // The exploitable relationship: collect a driven member for salvage.
    const prey = field[0]!;
    sc.sim.teleportTo(prey.position.x, -prey.position.y);
    const bank0 = sc.sim.player.banked.salvage ?? 0;
    sc.step({ ...emptyInput(), interact: true });
    expect((sc.sim.player.banked.salvage ?? 0) - bank0, 'a collected member yields salvage').toBe(1);
  });
});
