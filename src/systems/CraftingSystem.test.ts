import { describe, expect, it } from 'vitest';
import { canCraft, craft, applyEquipment } from './CraftingSystem';
import { RECIPE_BY_ID } from '../content/recipes';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { createSimulation, makeSimWorld, emptyInput } from '../sim/Simulation';
import { O2_MAX } from '../game/constants';

describe('CraftingSystem (request §9, §62)', () => {
  it('a crafted upgrade mutates the player capability set', () => {
    const player = new Player({ x: 0, y: 0 });
    const controller = new PlayerController(player);
    const fins = RECIPE_BY_ID.get('fins-1')!;
    expect(player.capabilities.has('boost')).toBe(false);
    const pool = { salvage: 8 };
    const result = craft(player, pool, fins, new Set());
    expect(result.crafted).toBe(true);
    expect(player.capabilities.has('boost')).toBe(true);
    expect(pool.salvage ?? 0).toBe(0);
  });

  it('a crafted upgrade changes a real capability (oxygen capacity)', () => {
    const player = new Player({ x: 0, y: 0 });
    applyEquipment(player, RECIPE_BY_ID.get('tank-1')!);
    expect(player.o2Max).toBe(O2_MAX + 65);
  });

  it('rejects a craft with insufficient materials and changes no state', () => {
    const player = new Player({ x: 0, y: 0 });
    const tank = RECIPE_BY_ID.get('tank-1')!;
    const pool = { salvage: 3 }; // tank-1 costs 6
    expect(canCraft(pool, tank)).toBe(false);
    const before = player.o2Max;
    const result = craft(player, pool, tank, new Set());
    expect(result.crafted).toBe(false);
    expect(result.reason).toBe('insufficient');
    expect(player.o2Max).toBe(before);
    expect(pool.salvage).toBe(3);
  });

  it('rejects an unknown recipe with no state change', () => {
    const player = new Player({ x: 0, y: 0 });
    const result = craft(player, { salvage: 99 }, undefined, new Set());
    expect(result.crafted).toBe(false);
    expect(result.reason).toBe('unknown');
  });

  it('the simulation crafts through the same gameplay action the browser menu submits', () => {
    const sim = createSimulation(makeSimWorld(), 1);
    sim.giveResources('salvage', 8);
    const input = emptyInput();
    input.craftRequest = 'tank-1';
    const before = sim.player.o2Max;
    const result = sim.handleCraft(input);
    expect(result.crafted).toBe(true);
    expect(sim.player.o2Max).toBe(before + 65);
    expect(sim.player.equipmentIds).toContain('tank-1');
    // The one-shot is consumed: a second step with no request does not re-craft.
    expect(sim.handleCraft(emptyInput()).reason).toBe('unknown');
  });

  it('the simulation rejects an unaffordable craft through the gameplay action', () => {
    const sim = createSimulation(makeSimWorld(), 1);
    sim.giveResources('salvage', 2); // tank-1 costs 6
    const input = emptyInput();
    input.craftRequest = 'tank-1';
    const result = sim.handleCraft(input);
    expect(result.crafted).toBe(false);
    expect(result.reason).toBe('insufficient');
    expect(sim.player.equipmentIds).not.toContain('tank-1');
  });
});
