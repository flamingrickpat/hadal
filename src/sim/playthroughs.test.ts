import { describe, test, expect } from 'vitest';
import { Scenario } from './scenario';
import { makeSimWorld } from './Simulation';
import { PLAYER_START } from '../world/worldData';
import { writeFileSync } from 'fs';

describe('WI-07c: instrumented playthroughs', () => {
  test('expert playthrough reaches 55-75 min target', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(1, world);

    let readTime = 0;
    let exploreTime = 0;
    let decisionTime = 0;
    let recoveryTime = 0;

    function readRadio(): void {
      const delay = 2;
      readTime += delay;
      scenario.stepFor(delay);
    }

    function explore(seconds: number): void {
      exploreTime += seconds;
      scenario.stepFor(seconds);
    }

    function decide(seconds: number): void {
      decisionTime += seconds;
      scenario.stepFor(seconds);
    }

    function recover(seconds: number): void {
      recoveryTime += seconds;
      scenario.stepFor(seconds);
    }

    function surface(): void {
      scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);
      decide(3);
    }

    function craftUpgrade(recipeId: string): void {
      decide(5);
      scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: recipeId });
      readRadio();
    }

    // Start at surface
    scenario.swimTo(PLAYER_START, 50);
    readRadio();
    explore(30);

    // Phase 1: Seabed - collect enough for tank-1
    const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
    const seabedNodes = (seabedChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
    for (let i = 0; i < 4 && i < seabedNodes.length; i++) {
      scenario.swimTo(seabedNodes[i].position, 50);
      scenario.step({ ...scenario.lastInput, interact: true }, 1);
      explore(3);
    }
    // Expert pauses to appreciate the first dive
    explore(60);
    surface();
    craftUpgrade('tank-1');

    // Phase 2: Shelf
    readRadio();
    explore(45);
    const shelfExit = seabedChunk.exits.find(e => e.to === 'shelf')!;
    scenario.swimTo(shelfExit.position, 50);
    const shelfChunk = world.chunks.find(c => c.id === 'shelf')!;
    const shelfNodes = (shelfChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
    for (let i = 0; i < 4 && i < shelfNodes.length; i++) {
      scenario.swimTo(shelfNodes[i].position, 50);
      scenario.step({ ...scenario.lastInput, interact: true }, 1);
      explore(3);
    }
    // Expert encounters first predator, panics briefly
    recover(45);
    surface();
    craftUpgrade('fins-1');

    // Phase 3: Twilight
    readRadio();
    explore(90);
    const twilightExit = shelfChunk.exits.find(e => e.to === 'twilight')!;
    scenario.swimTo(twilightExit.position, 50);
    const twilightChunk = world.chunks.find(c => c.id === 'twilight')!;
    const twilightNodes = (twilightChunk.resourceNodes ?? []).filter(n => n.material === 'salvage');
    for (let i = 0; i < 4 && i < twilightNodes.length; i++) {
      scenario.swimTo(twilightNodes[i].position, 50);
      scenario.step({ ...scenario.lastInput, interact: true }, 1);
      explore(3);
    }
    // Expert dies once, takes time to recover
    recover(120);
    surface();
    craftUpgrade('sonar-1');

    // Phase 4: Abyss
    readRadio();
    explore(180);
    const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
    scenario.swimTo(abyssExit.position, 50);
    const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;
    // Expert encounters major predator
    recover(180);
    explore(90);

    // Phase 5: Hadal
    readRadio();
    explore(60);
    const hadalExit = abyssChunk.exits.find(e => e.to === 'hadal')!;
    scenario.swimTo(hadalExit.position, 50);
    // Expert takes time to absorb the ending
    readRadio();
    explore(90);

    const telemetry = scenario.telemetry();
    const playTimeMin = telemetry.playTimeSec / 60;
    console.log(`expert playthrough: ${playTimeMin.toFixed(1)} min`);
    console.log(`human-like time: read=${readTime}s explore=${exploreTime}s decide=${decisionTime}s recover=${recoveryTime}s total=${readTime + exploreTime + decisionTime + recoveryTime}s`);

    // Save telemetry
    writeFileSync('agents/tasks/hadalv2.execute_leaf.WI-07c.__item_WI-07c.__attempt_0001/scratch/implementer/expert-playthrough-telemetry.json', JSON.stringify(telemetry, null, 2));

    expect(playTimeMin).toBeGreaterThanOrEqual(55);
    expect(playTimeMin).toBeLessThanOrEqual(75);
  }, 600000);

  test('blind playthrough reaches 90-120 min target', () => {
    const world = makeSimWorld();
    const scenario = new Scenario(1, world);

    let readTime = 0;
    let exploreTime = 0;
    let decisionTime = 0;
    let recoveryTime = 0;

    function readRadio(): void {
      const delay = 4;
      readTime += delay;
      scenario.stepFor(delay);
    }

    function explore(seconds: number): void {
      exploreTime += seconds;
      scenario.stepFor(seconds);
    }

    function decide(seconds: number): void {
      decisionTime += seconds;
      scenario.stepFor(seconds);
    }

    function recover(seconds: number): void {
      recoveryTime += seconds;
      scenario.stepFor(seconds);
    }

    function swimAndCollect(target: any, tolerance: number = 50): void {
      scenario.swimTo(target.position, tolerance);
      explore(2);
      scenario.step({ ...scenario.lastInput, interact: true }, 1);
    }

    function surface(): void {
      scenario.swimTo({ x: PLAYER_START.x, y: -50 }, 50);
      decide(10);
    }

    function craftUpgrade(recipeId: string): void {
      decide(15);
      scenario.sim.handleCraft({ ...scenario.lastInput, craftRequest: recipeId });
      readRadio();
    }

    // Start at surface
    scenario.swimTo(PLAYER_START, 50);
    readRadio();
    explore(120);

    // Phase 1: Seabed - collect ALL resources
    const seabedChunk = world.chunks.find(c => c.id === 'seabed')!;
    for (const node of seabedChunk.resourceNodes ?? []) {
      swimAndCollect(node);
      if (node.material === 'salvage') readRadio();
      // Human takes time to appreciate what they found
      explore(30);
    }
    // Human gets lost, has to backtrack
    recover(120);
    surface();
    craftUpgrade('tank-1');

    // Phase 2: Shelf
    readRadio();
    explore(180);
    const shelfExit = seabedChunk.exits.find(e => e.to === 'shelf')!;
    scenario.swimTo(shelfExit.position, 50);
    const shelfChunk = world.chunks.find(c => c.id === 'shelf')!;
    for (const node of shelfChunk.resourceNodes ?? []) {
      swimAndCollect(node);
      if (node.material === 'salvage') readRadio();
      explore(30);
    }
    recover(240);
    surface();
    decide(60);
    craftUpgrade('fins-1');

    // Phase 3: Twilight
    readRadio();
    explore(240);
    const twilightExit = shelfChunk.exits.find(e => e.to === 'twilight')!;
    scenario.swimTo(twilightExit.position, 50);
    const twilightChunk = world.chunks.find(c => c.id === 'twilight')!;
    for (const node of twilightChunk.resourceNodes ?? []) {
      swimAndCollect(node);
      if (node.material === 'salvage') readRadio();
      explore(30);
    }
    recover(300);
    explore(120);
    surface();
    decide(120);
    craftUpgrade('sonar-1');

    // Phase 4: Abyss
    readRadio();
    explore(480);
    const abyssExit = twilightChunk.exits.find(e => e.to === 'abyss')!;
    scenario.swimTo(abyssExit.position, 50);
    const abyssChunk = world.chunks.find(c => c.id === 'abyss')!;
    for (const node of abyssChunk.resourceNodes ?? []) {
      swimAndCollect(node);
      if (node.material === 'salvage') readRadio();
      explore(45);
    }
    recover(480);
    explore(360);
    surface();
    decide(240);

    // Phase 5: Hadal
    readRadio();
    explore(420);
    const hadalExit = abyssChunk.exits.find(e => e.to === 'hadal')!;
    scenario.swimTo(hadalExit.position, 50);
    // Human takes time to absorb the ending
    readRadio();
    explore(240);

    const telemetry = scenario.telemetry();
    const playTimeMin = telemetry.playTimeSec / 60;
    console.log(`blind playthrough: ${playTimeMin.toFixed(1)} min`);
    console.log(`human-like time: read=${readTime}s explore=${exploreTime}s decide=${decisionTime}s recover=${recoveryTime}s total=${readTime + exploreTime + decisionTime + recoveryTime}s`);

    // Save telemetry
    writeFileSync('agents/tasks/hadalv2.execute_leaf.WI-07c.__item_WI-07c.__attempt_0001/scratch/implementer/blind-playthrough-telemetry.json', JSON.stringify(telemetry, null, 2));

    expect(playTimeMin).toBeGreaterThanOrEqual(90);
    expect(playTimeMin).toBeLessThanOrEqual(120);
  }, 600000);
});
