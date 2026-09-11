/**
 * Tests for save-schema extension and endgame autosave milestones (WI-05cb, request §25/§42/§70):
 *   The versioned save schema is extended with endgame milestone fields. Pre-descent
 *   and post-trigger autosave points are implemented so the final sequence can be
 *   saved and reloaded at each milestone.
 */
import { describe, it, expect } from 'vitest';
import { Scenario } from './scenario';
import { emptyInput } from './Simulation';
import { vec2 } from '../util/math';
import { INTERACT_RADIUS } from '../game/constants';
import {
  freshSave,
  parseSave,
  serializeSave,
  makeMemoryStorage,
  saveToStorage,
  loadFromStorage,
  SAVE_VERSION,
  SAVE_KEY,
} from '../game/save';

describe('Save schema extension (WI-05cb)', () => {
  // Helper: swim to the MacGuffin and retrieve it (same route as WI-05a/WI-05b).
  function swimToMacguffinAndRetrieve(s: Scenario): void {
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
  }

  it('save schema version bumps from 1 to 2', () => {
    expect(SAVE_VERSION).toBe(2);
    expect(freshSave().version).toBe(2);
  });

  it('pre-extension save (v1) migrates to v2 with defaults', () => {
    // Create a version 1 save and load it into the v2 schema.
    const v1Save = {
      version: 1,
      playTimeSec: 1234.5,
      player: {
        health: 42,
        oxygenUpgrade: 1,
        equipmentIds: ['tank-1', 'fins-1'],
        inventory: { salvage: 5 },
        banked: { salvage: 12 },
      },
      world: {
        discoveredChunks: ['seabed', 'wall'],
        openedShortcuts: [],
        collectedUniqueIds: ['macguffin'],
        storyFlags: ['final-descent-active'],
        maxDepth: 9700,
        endingTriggered: false,
      },
      settings: { masterVolume: 0.6 },
    };
    const storage = makeMemoryStorage({ [SAVE_KEY]: JSON.stringify(v1Save) });
    const { save, reset } = loadFromStorage(storage);
    expect(reset).toBe(false);
    expect(save.version).toBe(2);
    // Migration adds defaults to the new endgame fields.
    expect(save.world.endingVariant).toBeUndefined();
    expect(save.world.finalSequenceStep).toBeUndefined();
    expect(save.world.autosaveMilestones).toBeDefined();
    // Existing fields are preserved.
    expect(save.world.storyFlags).toContain('final-descent-active');
    expect(save.player.equipmentIds).toEqual(['tank-1', 'fins-1']);
    expect(save.world.maxDepth).toBe(9700);
  });

  it('pre-descent autosave: final sequence entry sets the milestone flag', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // After MacGuffin retrieval and final sequence entry, the pre-descent
    // autosave milestone flag should be set.
    expect(s.sim.storyFlags).toContain('final-descent-active');
    expect(s.sim.autosaveRequested).toBe(true);
    expect(s.sim.autosaveMilestones).toContain('pre-descent');
  });

  it('pre-descent reload: final sequence continues from the saved point', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // The final descent sequence should be active.
    expect(s.sim.storyFlags).toContain('final-descent-active');
    // Serialize the save at this point.
    const raw = serializeSave(s.sim.toSave());
    const save = parseSave(raw);
    expect(save.world.autosaveMilestones).toContain('pre-descent');
    // Reload from the pre-descent save.
    const s2 = new Scenario(42);
    s2.sim.loadFromSave(save);
    expect(s2.sim.storyFlags).toContain('final-descent-active');
    expect(s2.sim.endingTriggered).toBe(false);
    // The player can continue and reach the exit.
    s2.swimTo(vec2(5600, -2200), 40, 20000);
    s2.swimTo(vec2(9500, -5000), 40, 20000);
    s2.swimTo(vec2(14500, -7800), 40, 20000);
    s2.swimTo(vec2(19200, -9500), 40, 20000);
    s2.swimTo(vec2(19200, -9680), 40, 20000);
    s2.swimTo(vec2(20300, -9650), 40, 20000);
    s2.swimTo(vec2(22000, -9650), 50, 20000);
    s2.swimTo(vec2(22300, -9600), 50, 20000);
    expect(s2.sim.endingTriggered).toBe(true);
  });

  it('post-trigger autosave: ending trigger sets the milestone flag', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    // Complete the final sequence.
    s.swimTo(vec2(22000, -9650), 50, 10000);
    s.swimTo(vec2(22300, -9600), 50, 10000);
    expect(s.sim.endingTriggered).toBe(true);
    // The post-trigger autosave milestone flag should be set.
    expect(s.sim.autosaveRequested).toBe(true);
    expect(s.sim.autosaveMilestones).toContain('post-trigger');
  });

  it('post-trigger reload: ending is re-presented without re-firing', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 10000);
    s.swimTo(vec2(22300, -9600), 50, 10000);
    expect(s.sim.endingTriggered).toBe(true);
    // Serialize the save at this point.
    const raw = serializeSave(s.sim.toSave());
    const save = parseSave(raw);
    expect(save.world.autosaveMilestones).toContain('post-trigger');
    // Reload from the post-trigger save.
    const s2 = new Scenario(42);
    s2.sim.loadFromSave(save);
    expect(s2.sim.endingTriggered).toBe(true);
    // The trigger should not fire again on reload.
    const endingFlags = s2.sim.storyFlags.filter((f) => f === 'ending-triggered');
    expect(endingFlags.length).toBe(1);
  });

  it('restart clears endgame fields', () => {
    const s = new Scenario(42);
    swimToMacguffinAndRetrieve(s);
    s.swimTo(vec2(22000, -9650), 50, 10000);
    s.swimTo(vec2(22300, -9600), 50, 10000);
    expect(s.sim.endingTriggered).toBe(true);
    // Restart creates a fresh save.
    const fresh = freshSave();
    expect(fresh.version).toBe(2);
    expect(fresh.world.endingVariant).toBeUndefined();
    expect(fresh.world.finalSequenceStep).toBeUndefined();
    expect(fresh.world.autosaveMilestones).toEqual([]);
  });

  it('determinism: same seed, same route, same autosave-point contents', () => {
    const run = () => {
      const s = new Scenario(42);
      swimToMacguffinAndRetrieve(s);
      s.swimTo(vec2(22000, -9650), 50, 10000);
      s.swimTo(vec2(22300, -9600), 50, 10000);
      return {
        endingTriggered: s.sim.endingTriggered,
        save: serializeSave(s.sim.toSave()),
      };
    };
    const r1 = run();
    const r2 = run();
    expect(r1.endingTriggered).toBe(r2.endingTriggered);
    expect(r1.save).toBe(r2.save);
  });
});
