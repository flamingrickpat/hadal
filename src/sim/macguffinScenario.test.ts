/**
 * Tests for the MacGuffin retrieval interaction (WI-05a, request §23/§45/§51):
 *   the MacGuffin is placed in the final zone (hadal), retrievable through
 *   gameplay from a fresh save (no noclip, no direct state edit), with at least
 *   two earlier environmental traces foreshadowing it, and its retrieval
 *   begins the post-retrieval environmental change (environmental change observable in sim state).
 *
 * The MacGuffin's true nature is private (internal id only, request §0/§12/§68);
 * these tests verify the mechanics, not the creative content.
 */
import { describe, it, expect } from 'vitest';
import { makeSimWorld, Simulation } from './Simulation';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { MACRO_WORLD, BASE } from '../world/worldData';
import { INTERACT_RADIUS } from '../game/constants';
import { vec2 } from '../util/math';

describe('MacGuffin retrieval (WI-05a)', () => {
  it('MacGuffin is placed in the hadal (final) zone', () => {
    const hadal = MACRO_WORLD.find((c) => c.id === 'hadal');
    expect(hadal).toBeDefined();
    const macguffin = hadal!.props!.find((p) => p.id === 'macguffin');
    expect(macguffin).toBeDefined();
    expect(macguffin!.kind).toBe('facility');
    // In the hadal interior (x 20300..22700, y -9800..-9400).
    expect(macguffin!.position.x).toBeGreaterThan(20300);
    expect(macguffin!.position.x).toBeLessThan(22700);
    expect(macguffin!.position.y).toBeGreaterThan(-9800);
    expect(macguffin!.position.y).toBeLessThan(-9400);
  });

  it('at least 2 earlier traces reference the MacGuffin (R3)', () => {
    // The R3 traces are placed in earlier zones by WI-04b. They allude to the
    // MacGuffin without naming it (request §51). Count R3 traces.
    let r3Count = 0;
    for (const chunk of MACRO_WORLD) {
      for (const prop of chunk.props ?? []) {
        if (prop.id.includes('-R3')) r3Count++;
      }
    }
    expect(r3Count).toBeGreaterThanOrEqual(2);
  });

  it('retrieval requires reaching the MacGuffin location', () => {
    const s = new Scenario(42);
    // Swim to the coast seabed (far from the hadal).
    s.swimTo(vec2(1300, -1400), 100, 10000);
    // Press interact at the coast — should not retrieve the MacGuffin.
    const input = emptyInput();
    input.interact = true;
    s.step(input);
    expect(s.sim.storyFlags).not.toContain('macguffin-retrieved');
  });

  it('retrieval sets the macguffin-retrieved story flag', () => {
    // Swim to the MacGuffin's location (in the hadal zone) and interact.
    const s = new Scenario(42);
    // Find the MacGuffin's position from the sim.
    expect(s.sim.macguffinPosition).not.toBeNull();
    const mgPos = s.sim.macguffinPosition!;
    // Use the same dive route as the beat scenario test (WI-04a) to reach the
    // hadal zone efficiently. The MacGuffin is inside the hadal interior, at
    // the end of the route.
    s.swimTo(vec2(5600, -2200), 40, 6000); // coast-to-shelf descent gap
    s.swimTo(vec2(9500, -5000), 40, 6000); // shelf-to-twilight gap
    s.swimTo(vec2(14500, -7800), 40, 6000); // twilight floor gap
    s.swimTo(vec2(19200, -9500), 40, 6000); // above the hadal strip
    s.swimTo(vec2(19200, -9680), 40, 6000); // strip drop
    s.swimTo(vec2(20300, -9650), 40, 6000); // enter the hadal interior
    s.swimTo(mgPos, INTERACT_RADIUS, 6000); // swim to the MacGuffin
    // Press interact to retrieve.
    const input = emptyInput();
    input.interact = true;
    s.step(input);
    expect(s.sim.storyFlags).toContain('macguffin-retrieved');
  });

  it('retrieval applies the post-retrieval environmental change (ambient changes)', () => {
    const s = new Scenario(42);
    const mgPos = s.sim.macguffinPosition!;
    // Dive to the hadal zone using the same route.
    s.swimTo(vec2(5600, -2200), 40, 6000);
    s.swimTo(vec2(9500, -5000), 40, 6000);
    s.swimTo(vec2(14500, -7800), 40, 6000);
    s.swimTo(vec2(19200, -9500), 40, 6000);
    s.swimTo(vec2(19200, -9680), 40, 6000);
    s.swimTo(vec2(20300, -9650), 40, 6000);
    s.swimTo(mgPos, INTERACT_RADIUS, 6000);
    const input = emptyInput();
    input.interact = true;
    s.step(input);
    // The post-retrieval environmental change alters the ambient (dim, sound, current).
    expect(s.sim.triggerState.ambient['dim']).toBe(0.3);
    expect(s.sim.triggerState.ambient['sound']).toBe(0.2);
    expect(s.sim.triggerState.ambient['current']).toBe(0.1);
  });

  it('determinism: same seed, same retrieval outcome', () => {
    const run = () => {
      const s = new Scenario(42);
      const mgPos = s.sim.macguffinPosition!;
      s.swimTo(vec2(5600, -2200), 40, 6000);
      s.swimTo(vec2(9500, -5000), 40, 6000);
      s.swimTo(vec2(14500, -7800), 40, 6000);
      s.swimTo(vec2(19200, -9500), 40, 6000);
      s.swimTo(vec2(19200, -9680), 40, 6000);
      s.swimTo(vec2(20300, -9650), 40, 6000);
      s.swimTo(mgPos, INTERACT_RADIUS, 6000);
      const input = emptyInput();
      input.interact = true;
      s.step(input);
      return s.sim.storyFlags.slice().sort().join(',');
    };
    expect(run()).toBe(run());
  });
});
