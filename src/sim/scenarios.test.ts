import { describe, expect, it } from 'vitest';
import { Scenario } from './scenario';
import { createSimulation, createSimulationFromSave, emptyInput, makeSimWorld } from './Simulation';
import { BASE, PLAYER_START } from '../world/worldData';
import { DEATH_RESOURCE_LOSS_FRACTION, FIXED_DT, HP_MAX, INTERACT_RADIUS, O2_MAX } from '../game/constants';
import type { Vec2 } from '../util/math';

function harvestTwoNodes(s: Scenario, idA: string, idB: string): void {
  const harvestInput = emptyInput();
  harvestInput.interact = true;
  s.swimTo(s.findNodePosition(idA)!, 40);
  s.stepFor(0.5, harvestInput);
  s.swimTo(s.findNodePosition(idB)!, 40);
  s.stepFor(0.5, harvestInput);
}

describe('§30 simulation boundary', () => {
  it('the simulation + world data import and run in Node without browser globals', () => {
    expect(typeof createSimulation).toBe('function');
    expect(typeof makeSimWorld).toBe('function');
    const sim = createSimulation(makeSimWorld(), 0);
    expect(sim.player.position.x).toBe(PLAYER_START.x);
    sim.step(emptyInput(), FIXED_DT);
    expect(sim.toSave().version).toBe(1);
  });
});

describe('separate headless scenarios (request §70)', () => {
  it('death: respawns at the base, keeps upgrades, loses a modest fraction of unbanked', () => {
    const s = new Scenario(2);
    const sim = s.sim;
    // Harvest + bank + craft, then carry 8 unbanked salvage out and die.
    harvestTwoNodes(s, 'salvage-1', 'salvage-2');
    s.swimTo(BASE.position, 60);
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    s.assert(sim.handleCraft(craftInput).crafted, 'crafted tank-1 at the base');
    harvestTwoNodes(s, 'salvage-3', 'salvage-4');
    const beforeDeath = sim.player.inventory.salvage ?? 0;
    expect(beforeDeath).toBeGreaterThanOrEqual(8);
    // Dive deep (below the surface refill) with low O2 so the sim's own
    // zero-O2 drain kills the player; not reachability evidence. No thrust:
    // the player stays deep (no current), O2 drains, then health drains to 0
    // and the sim respawns the player at the base.
    sim.teleportTo(1300, 900);
    sim.player.o2 = 5;
    let steps = 0;
    while (!sim.isAtBase(sim.player.position) && steps < 5000) {
      s.step(emptyInput());
      steps++;
    }
    // The only way the player (at y=-900, no thrust) reaches the base is by
    // dying and respawning there.
    s.assert(sim.isAtBase(sim.player.position), 'the player died and respawned at the surface base');
    s.assert(sim.player.o2 === sim.player.o2Max, 'oxygen refilled on respawn');
    s.assert(sim.player.health === HP_MAX, 'health refilled on respawn');
    s.assert(sim.player.equipmentIds.includes('tank-1'), 'permanent upgrade kept on death');
    const expected = Math.floor(beforeDeath * (1 - DEATH_RESOURCE_LOSS_FRACTION));
    s.assert(
      (sim.player.inventory.salvage ?? 0) === expected,
      `unbanked reduced to a modest fraction (got ${sim.player.inventory.salvage ?? 0}, expected ${expected})`,
    );
  });

  it('insufficient materials: crafting is rejected with no state change', () => {
    const s = new Scenario(3);
    const sim = s.sim;
    sim.giveResources('salvage', 3); // tank-1 costs 6
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    const result = sim.handleCraft(craftInput);
    s.assert(!result.crafted, 'the craft is rejected');
    s.assert(result.reason === 'insufficient', 'rejected for insufficient materials');
    s.assert(sim.player.equipmentIds.length === 0, 'no upgrade applied');
    s.assert(sim.player.o2Max === O2_MAX, 'capability unchanged');
  });

  it('blocked route: the sealed node is unreachable from the start', () => {
    const s = new Scenario(4);
    const sim = s.sim;
    const target: Vec2 = s.findNodePosition('salvage-sealed')!;
    s.swimTo(target, 50, 6000); // try to reach it; the seal blocks the route
    s.assert(s.distanceTo(target) > INTERACT_RADIUS, `blocked from the sealed node (d=${s.distanceTo(target).toFixed(1)})`);
    s.assert((sim.player.inventory.salvage ?? 0) === 0, 'did not harvest the sealed node');
  });

  it('depleted resources: harvesting all reachable nodes leaves none to collect', () => {
    const s = new Scenario(5);
    const sim = s.sim;
    const ids = ['salvage-1', 'salvage-2', 'salvage-3', 'salvage-4', 'salvage-5'];
    for (let i = 0; i < ids.length; i++) {
      s.swimTo(s.findNodePosition(ids[i]!)!, 40);
      const input = emptyInput();
      input.interact = true;
      s.stepFor(0.5, input);
      // Bank at the base every couple of nodes so cargo (capacity 10) frees up.
      if (i % 2 === 1) s.swimTo(BASE.position, 60);
    }
    s.swimTo(BASE.position, 60);
    const reachable = sim.nodes.filter((n) => n.id !== 'salvage-sealed');
    s.assert(reachable.every((n) => n.harvested), 'all reachable nodes are depleted');
    const pool = sim.combinedPool();
    s.assert((pool.salvage ?? 0) >= 20, `collected the reachable salvage (total=${pool.salvage ?? 0})`);
  });

  it('a failing assertion produces a trace with seed, time, position, input, assertion', () => {
    const s = new Scenario(7);
    const input = emptyInput();
    input.thrustX = 1;
    s.step(input);
    s.stepFor(1.0);
    let failed = false;
    try {
      s.assert(false, 'deliberate failure for the trace test');
    } catch (e) {
      failed = true;
      const msg = (e as Error).message;
      expect(msg).toContain('seed=7');
      expect(msg).toContain('t=');
      expect(msg).toContain('pos=');
      expect(msg).toContain('thrustX:');
      expect(msg).toContain('deliberate failure for the trace test');
    }
    expect(failed).toBe(true);
  });

  it('a save loaded into a fresh simulation drives the same progression (step 8–9)', () => {
    const s = new Scenario(8);
    const sim = s.sim;
    sim.giveResources('salvage', 6);
    const craftInput = emptyInput();
    craftInput.craftRequest = 'tank-1';
    sim.handleCraft(craftInput);
    const fresh = createSimulationFromSave(sim.toSave());
    s.assert(fresh.player.equipmentIds.includes('tank-1'), 'upgrade persists after save/load');
    s.assert(fresh.player.o2Max === O2_MAX + 65, 'capability persists after save/load');
  });
});
