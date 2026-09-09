/**
 * WI-02b acceptance tests: the creature renderers draw simulation state
 * (the two WI-02a fixtures) without writing anything back, hold the
 * fixed-segment-distance spine contract (request §13.2), dispatch small
 * vs chain bodies, animate deterministically (not a pure sine), carry
 * found objects (request §13.4), and never clamp bodies to the screen
 * (request §13.3).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Creature } from '../creatures/Creature';
import type { CreatureDef } from '../creatures/CreatureDef';
import { FORAGER, SCHOOLER } from '../creatures/fixtures';
import { WorldSignalBus } from '../creatures/senses';
import { createRng } from '../util/rng';
import { vec2, type Vec2 } from '../util/math';
import { PLAYER_PLANE_Z } from '../game/constants';
import { bandProfileAtDepth } from './band';
import { buildSpineDef, makeSpineFrame, solveSpine } from './spineRenderer';
import { CreatureRenderer, makeFoundPanel } from './creatureRender';

// The two WI-02a fixtures are the only test subjects (no secret roster).
function makeCreature(def: CreatureDef, spawn: Vec2, seed = 7): Creature {
  return new Creature(def, spawn, new WorldSignalBus(), createRng(seed));
}

const profile = bandProfileAtDepth(600);

function simSnapshot(c: Creature): string {
  return JSON.stringify({
    position: c.position,
    velocity: c.velocity,
    state: c.state,
    active: c.active,
    home: c.home,
    target: c.target,
  });
}

describe('spine solver (request §13.2)', () => {
  it('pins the trunk node exactly at the simulated position and holds fixed segment distances', () => {
    const spine = buildSpineDef(FORAGER);
    const frame = makeSpineFrame(spine);
    const head = { x: 1000, y: -500 };
    solveSpine(spine, frame, head, 0.7);
    expect(frame.points[spine.pinned]!.x).toBeCloseTo(head.x, 6);
    expect(frame.points[spine.pinned]!.y).toBeCloseTo(head.y, 6);
    for (let i = 0; i < spine.segDist.length; i += 1) {
      const a = frame.points[i]!;
      const b = frame.points[i + 1]!;
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(spine.segDist[i]!, 3);
    }
  });

  it('matches the authored rest pose when the trunk sits at the rest position, heading 0', () => {
    const spine = buildSpineDef(FORAGER);
    const frame = makeSpineFrame(spine);
    solveSpine(spine, frame, { x: 0, y: 0 }, 0);
    for (let i = 0; i < spine.rest.length; i += 1) {
      expect(frame.points[i]!.x).toBeCloseTo(spine.rest[i]!.x, 3);
      expect(frame.points[i]!.y).toBeCloseTo(spine.rest[i]!.y, 3);
    }
  });

  it('computes unit normals perpendicular to each node tangent', () => {
    const spine = buildSpineDef(FORAGER);
    const frame = makeSpineFrame(spine);
    solveSpine(spine, frame, { x: 320, y: -140 }, 2.3);
    for (let i = 0; i < frame.points.length; i += 1) {
      const nx = frame.normalX[i]!;
      const ny = frame.normalY[i]!;
      expect(Math.hypot(nx, ny)).toBeCloseTo(1, 5);
      const dot = nx * Math.cos(frame.angles[i]!) + ny * Math.sin(frame.angles[i]!);
      expect(Math.abs(dot)).toBeLessThan(1e-6);
    }
  });

  it('gives a body without chain circles a synthetic 3-8 segment spine', () => {
    const spine = buildSpineDef(SCHOOLER);
    expect(spine.segments).toBeGreaterThanOrEqual(3);
    expect(spine.segments).toBeLessThanOrEqual(8);
    expect(spine.pinned).toBe(spine.rest.length - 1);
  });
});

describe('creature renderer — sim state in, nothing back (request §30, §13)', () => {
  it('derives output only from sim state: the creature is never mutated', () => {
    const creature = makeCreature(FORAGER, vec2(0, 0));
    const before = simSnapshot(creature);
    const renderer = new CreatureRenderer(new THREE.Scene());
    for (const t of [0, 0.4, 1.3, 2.7]) {
      renderer.update([creature], t, profile);
    }
    expect(simSnapshot(creature)).toBe(before);
    const visual = renderer.visuals.get(creature)!;
    expect(visual.group.position.z).toBe(PLAYER_PLANE_Z);
  });

  it('moves the visual with the simulated position', () => {
    const creature = makeCreature(FORAGER, vec2(10, 20));
    const renderer = new CreatureRenderer(new THREE.Scene());
    creature.velocity = vec2(60, 0);
    renderer.update([creature], 0.5, profile);
    const group = renderer.visuals.get(creature)!.group;
    expect(group.position.x).toBeCloseTo(10, 4);
    expect(group.position.y).toBeCloseTo(20, 4);
    creature.position.x = 900;
    creature.position.y = -300;
    renderer.update([creature], 0.6, profile);
    expect(group.position.x).toBeCloseTo(900, 4);
    expect(group.position.y).toBeCloseTo(-300, 4);
  });

  it('hides deactivated creatures instead of stepping them', () => {
    const creature = makeCreature(FORAGER, vec2(0, 0));
    const renderer = new CreatureRenderer(new THREE.Scene());
    renderer.update([creature], 0.5, profile);
    expect(renderer.visuals.get(creature)!.group.visible).toBe(true);
    creature.active = false;
    renderer.update([creature], 0.6, profile);
    expect(renderer.visuals.get(creature)!.group.visible).toBe(false);
  });

  it('dispatches: chain bodies render rigid per-circle parts, small bodies do not', () => {
    const renderer = new CreatureRenderer(new THREE.Scene());
    const forager = makeCreature(FORAGER, vec2(0, 0));
    const schooler = makeCreature(SCHOOLER, vec2(50, 0));
    renderer.update([forager, schooler], 0.5, profile);
    const f = renderer.visuals.get(forager)!;
    const s = renderer.visuals.get(schooler)!;
    expect(f.kind).toBe('spine');
    expect(f.partMeshes.length).toBe(FORAGER.body.chainCircles!.length);
    expect(f.finMeshes.length).toBeGreaterThanOrEqual(2);
    expect(s.kind).toBe('small');
    expect(s.partMeshes.length).toBe(0);
    expect(s.finMeshes.length).toBeGreaterThanOrEqual(2);
  });

  it('handles an empty creature list without error', () => {
    const renderer = new CreatureRenderer(new THREE.Scene());
    renderer.update([], 0, profile);
    expect(renderer.visuals.size).toBe(0);
  });

  it('animates deterministically: same state and time give the same frame, time moves the fins', () => {
    const a = makeCreature(FORAGER, vec2(0, 0));
    const b = makeCreature(FORAGER, vec2(0, 0));
    const ra = new CreatureRenderer(new THREE.Scene());
    const rb = new CreatureRenderer(new THREE.Scene());
    ra.update([a], 1.2, profile);
    rb.update([b], 1.2, profile);
    const va = ra.visuals.get(a)!;
    const vb = rb.visuals.get(b)!;
    expect(va.finMeshes[0]!.rotation.z).toBeCloseTo(vb.finMeshes[0]!.rotation.z, 6);
    ra.update([a], 1.45, profile);
    expect(va.finMeshes[0]!.rotation.z).not.toBeCloseTo(vb.finMeshes[0]!.rotation.z, 3);
    // Asymmetric appendage motion (request §13.5): left vs right fins differ.
    expect(va.finMeshes[0]!.rotation.z).not.toBeCloseTo(va.finMeshes[1]!.rotation.z, 3);
  });

  it('carries a found object that rides its attachment point with the creature', () => {
    const creature = makeCreature(FORAGER, vec2(0, 0));
    const renderer = new CreatureRenderer(new THREE.Scene());
    const panel = makeFoundPanel(60, 40);
    renderer.attachFoundObject(creature, panel, { node: 0, side: 1, distance: 50 });
    renderer.update([creature], 0.5, profile);
    const group = renderer.visuals.get(creature)!.group;
    // Bounded near the trunk while the creature sits at the origin.
    expect(Math.hypot(panel.position.x + group.position.x, panel.position.y + group.position.y)).toBeLessThan(150);
    creature.position.x = 500;
    creature.position.y = 200;
    renderer.update([creature], 0.55, profile);
    const wx = panel.position.x + group.position.x;
    const wy = panel.position.y + group.position.y;
    expect(Math.hypot(wx - 500, wy - 200)).toBeLessThan(150);
    renderer.detachFoundObjects(creature);
    expect(renderer.visuals.get(creature)!.foundObjects.length).toBe(0);
  });

  it('lets rigid bodies exceed the screen bounds without clamping (request §13.3)', () => {
    const leviathan: CreatureDef = {
      id: 'fixture-test-leviathan',
      body: {
        radius: 60,
        chainCircles: [
          { offset: vec2(-1500, 0), radius: 50 },
          { offset: vec2(1500, 0), radius: 50 },
        ],
      },
      movement: { maxSpeed: 40, accel: 100, dragRate: 3 },
      senses: {},
      behavior: { startState: 'idle' },
      audio: {},
      sizeClass: 'large',
    };
    const creature = makeCreature(leviathan, vec2(0, 0));
    const renderer = new CreatureRenderer(new THREE.Scene());
    renderer.update([creature], 0.3, profile);
    let maxDist = 0;
    for (const part of renderer.visuals.get(creature)!.partMeshes) {
      maxDist = Math.max(maxDist, Math.hypot(part.position.x, part.position.y));
    }
    // Half the view width is 1000 (CAMERA_VIEW_WIDTH 2000): a part this far
    // out proves the body is not clamped to what fits on screen.
    expect(maxDist).toBeGreaterThan(1300);
  });
});
