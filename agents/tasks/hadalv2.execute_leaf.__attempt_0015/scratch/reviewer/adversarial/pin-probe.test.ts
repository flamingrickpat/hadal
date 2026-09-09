/**
 * Reviewer attempt-2 adversarial probe for WI-03c1b (fix verification).
 * Targets the de-duplication fix specifically:
 * (A) the extracted pin controllers keep the pre-fix behavior exactly —
 *     pin to idle/target=null in every non-armed state, leave the armed
 *     state and target untouched — checked through the real defs and real
 *     Creature instances (no mocks);
 * (B) T-18 still has no controller (generic wander is its whole motion);
 * (C) the pin body exists exactly once in hiddenCreatures.ts (the
 *     byte-identical T-16/T-17 copies the finding named are gone).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { vec2 } from '../../../../../../src/util/math';
import { createRng } from '../../../../../../src/util/rng';
import { WorldSignalBus } from '../../../../../../src/creatures/senses';
import { Creature } from '../../../../../../src/creatures/Creature';
import { CREATURE_STATES, type CreatureDef, type CreatureState } from '../../../../../../src/creatures/CreatureDef';
import { T14, T16, T17, T18 } from '../../../../../../src/content/secret/hiddenCreatures';

const here = dirname(fileURLToPath(import.meta.url));
const hiddenCreaturesPath = resolve(here, '../../../../../../src/content/secret/hiddenCreatures.ts');

const percept = { noise: 0, light: 0, sonar: 0, injury: 0 };

function make(def: CreatureDef): InstanceType<typeof Creature> {
  return new Creature(def, vec2(0, 0), new WorldSignalBus(), createRng(1));
}

function pinCheck(def: CreatureDef, armed: CreatureState): void {
  const controller = def.behavior.controller;
  expect(controller, `${def.id} must carry a pin controller`).toBeDefined();
  const fn = controller!;
  for (const state of CREATURE_STATES) {
    const c = make(def);
    c.state = state;
    c.target = vec2(9, 9);
    fn(c, percept, 1 / 60);
    if (state === armed) {
      expect(c.state, `${def.id} armed state ${state} must be left untouched`).toBe(state);
      expect(c.target, `${def.id} armed target must be kept`).not.toBeNull();
    } else {
      expect(c.state, `${def.id} state ${state} must be pinned to idle`).toBe('idle');
      expect(c.target, `${def.id} state ${state} must null the target`).toBeNull();
    }
  }
}

describe('reviewer attempt-2 pin-controller probes (WI-03c1b fix)', () => {
  it('A: T-14 pins everything but the armed (alert) state, exactly as before the fix', () => {
    pinCheck(T14, 'alert');
  });

  it('A: T-16 pins everything but the strike (custom) state, exactly as before the fix', () => {
    pinCheck(T16, 'custom');
  });

  it('A: T-17 pins everything but the silk (custom) state, exactly as before the fix', () => {
    pinCheck(T17, 'custom');
  });

  it('B: T-18 carries no controller (generic wander is its whole motion)', () => {
    expect(T18.behavior.controller).toBeUndefined();
  });

  it('C: the pin body exists exactly once; the duplicated inline bodies are gone', () => {
    const src = readFileSync(hiddenCreaturesPath, 'utf8');
    const pinBody = /creature\.state = 'idle';\r?\n\s*creature\.target = null;/g;
    const matches = src.match(pinBody);
    expect(matches?.length, 'exactly one pin body remains').toBe(1);
    expect(src, 'no inline pin comparison for the custom state remains').not.toMatch(/creature\.state !== 'custom'/);
    expect(src, 'the parameterized factory is present').toMatch(/pinRestExcept/);
  });
});
