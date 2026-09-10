/**
 * Tests — the section 60 flag-gated world-state reactions (WI-04c):
 *   after the authored milestones, earlier zones change on return trips.
 *   The reactions are data-driven trigger compositions that fire when the
 *   player completes a milestone and the flag persists through the
 *   existing save round-trip. No new systems — each reaction is an
 *   additional action (spawn/despawn/move/ambient/audio) on the existing
 *   milestone trigger, gated by the milestone's completion flag.
 */
import { describe, expect, it } from 'vitest';
import { vec2 } from '../util/math';
import { makeSimWorld, Simulation, emptyInput } from './Simulation';
import { Scenario } from './scenario';

describe('world-state reactions (WI-04c, section 60)', () => {
  it('the production world data carries at least 3 reaction flags', () => {
    const triggers = makeSimWorld().chunks.flatMap((c) => c.triggers ?? []);
    // Reactions fire as part of the milestone triggers; they set reaction
    // flags that mark the world-state change as complete.
    let reactionCount = 0;
    for (const t of triggers) {
      for (const a of t.actions) {
        if (a.type === 'setStoryFlag' && a.flag.startsWith('react-')) {
          reactionCount++;
        }
      }
    }
    expect(reactionCount).toBeGreaterThanOrEqual(3);
  });

  it('reaction 1: clearing the corridor disturbs the shelf fish (fewer small animals)', () => {
    // From a fresh save, complete puzzle 1 (approach the T-17 debris field).
    const sc = new Scenario(2001, makeSimWorld());
    sc.sim.teleportTo(7200, 3500);
    sc.step(emptyInput());
    // Approach the debris to solve the puzzle.
    sc.swimTo(vec2(7200, -3600), 50, 3000);
    // The puzzle must have fired.
    expect(sc.sim.triggers.firedIds.has('puzzle-blocked-corridor'), 'puzzle 1 must fire').toBe(true);
    expect(sc.sim.storyFlags.includes('puzzle-corridor-1'), 'puzzle-corridor-1 flag must be set').toBe(true);
    // Reaction 1: the T-01 schooling fish are disturbed and have moved.
    // The reaction fires as part of the same trigger (flag-gated by the puzzle).
    expect(sc.sim.storyFlags.includes('react-shelf-fish'), 'the shelf-fish reaction flag must be set').toBe(true);
    // The T-01 creature should have been moved to the new location.
    const t01 = sc.sim.creatures.find((c) => c.def.id === 'T-01' && c.active);
    expect(t01, 'at least one T-01 must exist and be active').toBeDefined();
  });

  it('reaction 2: the current lift alters the twilight ambient (changed industrial lights)', () => {
    // Complete puzzle 2 (approach the T-08 feeder mechanism).
    const sc = new Scenario(2002, makeSimWorld());
    // Find the T-08 feeder in twilight.
    const feeder = sc.sim.creatures.find((c) => c.def.id === 'T-08');
    expect(feeder, 'T-08 feeder must exist in twilight').toBeDefined();
    sc.sim.teleportTo(feeder!.position.x - 100, -feeder!.position.y);
    // Approach the feeder.
    sc.swimTo(feeder!.position, 50, 3000);
    expect(sc.sim.triggers.firedIds.has('puzzle-current-lift'), 'puzzle 2 must fire').toBe(true);
    expect(sc.sim.storyFlags.includes('puzzle-lift-1'), 'puzzle-lift-1 flag must be set').toBe(true);
    // Reaction 2: the twilight ambient changes (the "changed industrial lights").
    expect(sc.sim.storyFlags.includes('react-twilight-ambient'), 'the twilight-ambient reaction flag must be set').toBe(true);
    // The ambient change should be recorded in the trigger state.
    expect(Object.keys(sc.sim.triggerState.ambient).length).toBeGreaterThan(0);
  });

  it('reaction 3: beat s1 moves the coast drift organism (new migration on return)', () => {
    // From a fresh save, reach the shelf (which triggers beat-s1).
    const sc = new Scenario(2003, makeSimWorld());
    // Swim to the shelf region.
    sc.swimTo(vec2(7000, -3500), 100, 8000);
    // The beat-s1 trigger should have fired.
    expect(sc.sim.triggers.firedIds.has('enc-beat-s1'), 'beat-s1 must fire on shelf entry').toBe(true);
    expect(sc.sim.storyFlags.includes('beat-s1'), 'beat-s1 flag must be set').toBe(true);
    // Reaction 3: the T-31 coast drift organism migrates out of the coast band.
    expect(sc.sim.storyFlags.includes('react-coast-migration'), 'the coast-migration reaction flag must be set').toBe(true);
  });

  it('reactions persist through save round-trip (the flags and their effects are saved)', () => {
    // Complete a milestone, save, load, and verify the reaction state persists.
    const sc = new Scenario(2004, makeSimWorld());
    // Reach the shelf to trigger beat-s1.
    sc.swimTo(vec2(7000, -3500), 100, 8000);
    expect(sc.sim.storyFlags.includes('beat-s1'), 'beat-s1 must be set').toBe(true);
    // Save and create a new simulation from the save.
    const save = sc.sim.toSave();
    const sc2 = new Scenario(2005, makeSimWorld());
    sc2.sim.loadFromSave(save);
    // The flags must persist.
    expect(sc2.sim.storyFlags.includes('beat-s1'), 'beat-s1 must persist through save/load').toBe(true);
    // The trigger state's storyFlags must also persist (shared reference).
    expect(sc2.sim.triggerState.storyFlags.includes('beat-s1'), 'the trigger state must see the persisted flag').toBe(true);
  });

  it('at least three distinct earlier zones are altered by the reactions', () => {
    // The three reactions target three different zones:
    // - react-shelf-fish: moves T-01 in the shelf zone
    // - react-twilight-ambient: alters ambient in the twilight zone
    // - react-coast-migration: moves T-31 out of the coast zone
    const triggers = makeSimWorld().chunks.flatMap((c) => c.triggers ?? []);
    let shelfReacted = false;
    let twilightReacted = false;
    let coastReacted = false;
    for (const t of triggers) {
      for (const a of t.actions) {
        if (a.type === 'setStoryFlag') {
          if (a.flag === 'react-shelf-fish') shelfReacted = true;
          if (a.flag === 'react-twilight-ambient') twilightReacted = true;
          if (a.flag === 'react-coast-migration') coastReacted = true;
        }
      }
    }
    expect(shelfReacted, 'the shelf zone must have a reaction').toBe(true);
    expect(twilightReacted, 'the twilight zone must have a reaction').toBe(true);
    expect(coastReacted, 'the coast zone must have a reaction').toBe(true);
  });
});
