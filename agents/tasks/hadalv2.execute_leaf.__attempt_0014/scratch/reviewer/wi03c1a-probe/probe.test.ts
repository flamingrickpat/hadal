/**
 * Reviewer scratch probes — WI-03c1a (work-item-reviewer).
 *
 * Question each answers, independently of the implementer's own tests:
 *  - Is the section 10 damage model keyed by SIZE CLASS (not by the combat
 *    flag or by a specific id)? A medium non-attacker (T-18) must still die
 *    on the table's cost; a large creature must never die.
 *  - Does the harpoon actually pick the NEAREST creature in range (two
 *    targets, only the near one hit)?
 *  - Is a whiff (nothing in range) a no-op, and does a large deter REFRESH
 *    on repeated hits instead of ever killing?
 *  - No HP bar: live creature instances expose no hp/maxHp/health/hpMax.
 *
 * These drive the real production `Simulation` — no mocks of the rules.
 */
import { describe, expect, it } from 'vitest';
import { vec2 } from '../../../../../../src/util/math';
import {
  BASE,
  GREYBOX_WORLD,
} from '../../../../../../src/world/worldData';
import type { CreatureSpawnDef } from '../../../../../../src/world/chunks';
import { emptyInput, type SimWorld } from '../../../../../../src/sim/Simulation';
import { Scenario } from '../../../../../../src/sim/scenario';

function world(spawns: readonly CreatureSpawnDef[]): SimWorld {
  const chunks = GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c));
  return { chunks, base: BASE, currentFields: [] };
}

describe('WI-03c1a reviewer probes', () => {
  it('damage model is keyed by size class, not the combat flag: a medium non-attacker (T-18) still dies on the table cost', () => {
    // T-18 is a medium with NO `combat` (the roster's never-attacks field
    // herder). The spec's table is per size class, so it must still be
    // killable — and only at the medium cost (5), not a quick kill.
    const sc = new Scenario(900, world([{ id: 'p-t18', creature: 'T-18', position: vec2(1700, -300) }]));
    const c = sc.sim.creatures[0]!;
    expect(c.def.combat).toBeUndefined(); // precondition: this one has no combat
    sc.step({ ...emptyInput(), toolSelect: 2 }); // select the harpoon
    for (let shot = 1; shot <= 4; shot += 1) {
      sc.step({ ...emptyInput(), useTool: true });
      sc.step({ ...emptyInput(), useTool: false });
      expect(c.dead, `T-18 must survive hit ${shot} of 5`).toBe(false);
    }
    sc.step({ ...emptyInput(), useTool: true }); // fifth
    expect(c.dead, 'a medium dies on the 5th harpoon hit').toBe(true);
  });

  it('a large creature with no prior hunt deters, never kills, and its deter refreshes (T-16, the boulder)', () => {
    const sc = new Scenario(901, world([{ id: 'p-t16', creature: 'T-16', position: vec2(1700, -300) }]));
    const c = sc.sim.creatures[0]!;
    expect(c.def.sizeClass).toBe('large');
    sc.step({ ...emptyInput(), toolSelect: 2 }); // select the harpoon
    let prevDeter = -1;
    for (let shot = 1; shot <= 3; shot += 1) {
      sc.step({ ...emptyInput(), useTool: true });
      sc.step({ ...emptyInput(), useTool: false });
      expect(c.dead, `T-16 must never die (hit ${shot})`).toBe(false);
      expect(sc.sim.creatures.some((cr) => cr === c)).toBe(true);
      // The deter must be (re)asserted and refresh forward in sim time.
      expect(c.deterredUntil, `hit ${shot} must set a future deter`).toBeGreaterThan(sc.sim.state.timeSec);
      expect(c.deterredUntil).toBeGreaterThanOrEqual(prevDeter);
      prevDeter = c.deterredUntil;
    }
  });

  it('the harpoon hits the NEAREST creature in range, not an arbitrary one', () => {
    // Two small creatures, one clearly nearer to the player start (1300,-100).
    // The far one must survive an unambiguous near hit.
    const near = vec2(1450, -160); // d ~ 134
    const far = vec2(1850, -200); // d ~ 561, still inside HARPOON_RANGE 600
    const sc = new Scenario(902, world([
      { id: 'p-near', creature: 'T-17', position: near },
      { id: 'p-far', creature: 'T-17', position: far },
    ]));
    const [a, b] = sc.sim.creatures;
    const dOf = (cr: { position: { x: number; y: number } }) =>
      Math.hypot(cr.position.x - 1300, cr.position.y + 100); // player starts at (1300,-100)
    const nearObj = dOf(a!) <= dOf(b!) ? a! : b!;
    const farObj = nearObj === a ? b! : a!;
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(nearObj.dead, 'the nearest organism takes the hit').toBe(true);
    expect(farObj.dead, 'the farther organism must survive').toBe(false);
    expect(sc.sim.creatures).toHaveLength(1);
    expect(sc.sim.creatures[0]).toBe(farObj);
  });

  it('a whiff (nothing in range) is a no-op: the far organism survives an out-of-range shot', () => {
    // Single organism just beyond HARPOON_RANGE (east is open water).
    const sc = new Scenario(903, world([{ id: 'p-out', creature: 'T-17', position: vec2(1300 + 600 + 120, -100) }]));
    sc.step({ ...emptyInput(), toolSelect: 2 });
    sc.step({ ...emptyInput(), useTool: true });
    expect(sc.sim.creatures[0]!.dead).toBe(false);
    expect(sc.sim.creatures).toHaveLength(1);
  });

  it('no HP bar: every live tier-3 instance exposes no hp/maxHp/health/hpMax', () => {
    const sc = new Scenario(904, world([
      { id: 'p-hp-14', creature: 'T-14', position: vec2(1600, -300) },
      { id: 'p-hp-15', creature: 'T-15', position: vec2(1650, -320) },
      { id: 'p-hp-16', creature: 'T-16', position: vec2(1700, -340) },
      { id: 'p-hp-17', creature: 'T-17', position: vec2(1750, -360) },
      { id: 'p-hp-18', creature: 'T-18', position: vec2(1800, -380) },
    ]));
    expect(sc.sim.creatures).toHaveLength(5);
    for (const c of sc.sim.creatures) {
      for (const prop of ['hp', 'maxHp', 'health', 'hpMax']) {
        expect(c, `${c.def.id} must not expose ${prop}`).not.toHaveProperty(prop);
      }
    }
  });
});
