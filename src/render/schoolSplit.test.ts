import { describe, expect, it } from 'vitest';
import {
  SPLIT_PROXIMITY_RADIUS,
  SPLIT_SPREAD,
  SPLIT_REFORM_TIME,
  splitOffset,
  splitState,
  type SplitState,
} from './schoolSplit';
import { vec2, type Vec2 } from '../util/math';
import type { Creature } from '../creatures/Creature';
import type { CreatureDef } from '../creatures/CreatureDef';
import { WORLD_SIGNAL_LIFETIME } from '../creatures/senses';

describe('school split parameters', () => {
  it('exports proximity radius', () => {
    expect(SPLIT_PROXIMITY_RADIUS).toBeGreaterThan(0);
  });

  it('exports split spread', () => {
    expect(SPLIT_SPREAD).toBeGreaterThan(0);
  });

  it('exports re-form time', () => {
    expect(SPLIT_REFORM_TIME).toBeGreaterThan(0);
  });
});

function makeFakeCreature(pos: Vec2): Creature {
  // A fake creature with the fields splitOffset needs.
  const def: CreatureDef = {
    id: 'test-schooler',
    body: { radius: 18 },
    movement: { maxSpeed: 140, accel: 420, dragRate: 3 },
    senses: { noise: 0.2, light: 0.2, sonar: 0.2 },
    behavior: { startState: 'wander', wanderRadius: 500 },
    ecology: { school: true },
    audio: { investigate: 'test-attention' },
    sizeClass: 'small',
  };
  const creature: Creature = {
    def,
    home: vec2(pos.x, pos.y),
    position: vec2(pos.x, pos.y),
    velocity: vec2(0, 0),
    state: 'wander',
    active: true,
    target: null,
    percept: { noise: 0, light: 0, sonar: 0, injury: 0 },
    lastTransition: null,
  } as unknown as Creature;
  return creature;
}

describe('splitState classification', () => {
  it('returns "parting" when player is within proximity', () => {
    const state = splitState(vec2(0, 0), vec2(100, 0), true, 0);
    expect(state).toBe('parting');
  });

  it('returns "reforming" after player leaves, within re-form time', () => {
    const state = splitState(vec2(0, 0), vec2(500, 0), false, 0.25);
    expect(state).toBe('reforming');
  });

  it('returns "whole" after re-form time has passed', () => {
    const state = splitState(vec2(0, 0), vec2(500, 0), false, SPLIT_REFORM_TIME + 0.1);
    expect(state).toBe('whole');
  });

  it('returns "whole" when never in proximity', () => {
    const state = splitState(vec2(0, 0), vec2(500, 0), false, 0);
    expect(state).toBe('whole');
  });
});

describe('splitOffset', () => {
  it('returns zero offset when whole', () => {
    const member = makeFakeCreature(vec2(100, 0));
    const offset = splitOffset(member, vec2(50, 0), 'whole', 0);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('pushes members away from the player during parting', () => {
    const member = makeFakeCreature(vec2(100, 0));
    const playerPos = vec2(0, 0);
    const offset = splitOffset(member, playerPos, 'parting', 0);
    // Offset should be away from the player, along the positive x axis.
    expect(offset.x).toBeGreaterThan(0);
    expect(offset.y).toBeCloseTo(0);
    // At distance 100 from player (within 300 radius), strength should be scaled.
    const proximity = Math.min(1, 100 / SPLIT_PROXIMITY_RADIUS);
    const expectedStrength = SPLIT_SPREAD * (1 - proximity);
    expect(offset.x).toBeCloseTo(expectedStrength);
  });

  it('fades to zero during reforming as progress reaches 1', () => {
    const member = makeFakeCreature(vec2(100, 0));
    const playerPos = vec2(0, 0);
    const offset = splitOffset(member, playerPos, 'reforming', 1);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('is at full strength during reforming at progress 0', () => {
    const member = makeFakeCreature(vec2(100, 0));
    const playerPos = vec2(0, 0);
    const fullOffset = splitOffset(member, playerPos, 'parting', 0);
    const reformOffset = splitOffset(member, playerPos, 'reforming', 0);
    expect(reformOffset.x).toBe(fullOffset.x);
    expect(reformOffset.y).toBe(fullOffset.y);
  });

  it('scales offset by proximity (closer = stronger split)', () => {
    const nearMember = makeFakeCreature(vec2(50, 0));
    const farMember = makeFakeCreature(vec2(200, 0));
    const playerPos = vec2(0, 0);

    const nearOffset = splitOffset(nearMember, playerPos, 'parting', 0);
    const farOffset = splitOffset(farMember, playerPos, 'parting', 0);

    // Closer member gets a larger offset.
    expect(nearOffset.x).toBeGreaterThan(farOffset.x);
  });
});
