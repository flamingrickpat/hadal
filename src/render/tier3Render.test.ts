/**
 * WI-03c2 render verification for the tier-3 predators: the five organisms'
 * data-driven body shapes (the WI-03c1 `def.body` chain parameters) build
 * distinct silhouettes on the existing WI-02b spine pipeline (request §13 —
 * recognizable at a glance, no new renderer architecture), and a tier-3
 * predator visibly commits to its attack before contact (request §48): the
 * commit/armed state widens the body and spreads the fins versus the held
 * rest. Internal ids only (request §0/§33/§68); the silhouette and posture
 * facts are proven headlessly, and one browser spot-check confirms the live
 * page (see the tier's implementation note).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Creature } from '../creatures/Creature';
import { WorldSignalBus } from '../creatures/senses';
import { createRng } from '../util/rng';
import { vec2 } from '../util/math';
import { bandProfileAtDepth } from './band';
import { buildSpineDef } from './spineRenderer';
import { CreatureRenderer } from './creatureRender';
import { TIER3_CREATURES, TIER3_IDS } from '../content/secret/hiddenCreatures';

const profile = bandProfileAtDepth(8000);

function makeCreature(id: string, seed = 11): Creature {
  return new Creature(TIER3_CREATURES[id]!, vec2(0, 0), new WorldSignalBus(), createRng(seed));
}

/** A data-driven silhouette signature: node count, total and max width. */
function silhouetteSignature(id: string): string {
  const spine = buildSpineDef(TIER3_CREATURES[id]!);
  const widths = spine.widths.map((w) => Math.round(w));
  return `${spine.rest.length}|${widths.reduce((a, b) => a + b, 0)}|${Math.max(...widths)}|${widths.slice().sort((a, b) => a - b).join(',')}`;
}

/**
 * One fin's swing range over a short window (max minus min of its rotation):
 * the fin's fixed base angle is constant, so only the time-varying swing
 * term varies. The renderer scales that term by 1.4 in the commit state
 * (request §48/§13.5), isolating the commit posture from the body undulation.
 */
function finSwingRange(creature: Creature, renderer: CreatureRenderer, state: Creature['state']): number {
  creature.state = state;
  let lo = Infinity;
  let hi = -Infinity;
  for (let t = 0.0; t < 1.0; t += 0.05) {
    renderer.update([creature], t, profile);
    const fin = renderer.visuals.get(creature)!.finMeshes[0]!;
    lo = Math.min(lo, fin.rotation.z);
    hi = Math.max(hi, fin.rotation.z);
  }
  return hi - lo;
}

describe('tier-3 silhouettes are data-driven and distinct (request §13)', () => {
  it('every tier-3 body builds a real spine body, not a degenerate point', () => {
    for (const id of TIER3_IDS) {
      const spine = buildSpineDef(TIER3_CREATURES[id]!);
      // The body chain has real extent (a recognizable silhouette, request §13).
      expect(spine.rest.length, `${id} has no spine nodes`).toBeGreaterThanOrEqual(4);
      expect(Math.max(...spine.widths), `${id} has a degenerate (zero) width`).toBeGreaterThan(10);
    }
  });

  it('the five silhouettes are distinct, so each reads at a glance (request §13, §46)', () => {
    const seen = new Set<string>();
    for (const id of TIER3_IDS) {
      const sig = silhouetteSignature(id);
      expect(seen.has(sig), `duplicate tier-3 silhouette ${sig} at ${id}`).toBe(false);
      seen.add(sig);
    }
  });
});

describe('a tier-3 predator visibly commits to its attack before contact (request §48)', () => {
  // T-15 is the burst interceptor: it rests in `wander` and commits in
  // `attack` (the cornered charge, the pre-contact telegraph). The renderer
  // widens the body (posture 1.15) and spreads the fins (1.4x) for the commit
  // state. Its body is short, so the body span tracks the posture; the fin
  // swing range isolates the posture from the time-varying undulation.
  it('the commit (charge) state widens the body and spreads the fins versus the held rest', () => {
    const creature = makeCreature('T-15');
    const renderer = new CreatureRenderer(new THREE.Scene());

    // The body span measured at ONE fixed time: the undulation offset is
    // identical across the two reads, so only the commit posture (body widen,
    // posture 1.15) differs between them.
    const bodySpan = (state: Creature['state']): number => {
      creature.state = state;
      renderer.update([creature], 0.3, profile);
      const visual = renderer.visuals.get(creature)!;
      const pos = (visual as { bodyGeom: THREE.BufferGeometry }).bodyGeom.attributes.position!.array as Float32Array;
      let max = 0;
      for (let i = 0; i + 1 < pos.length; i += 3) max = Math.max(max, Math.hypot(pos[i]!, pos[i + 1]!));
      return max;
    };

    const restSpan = bodySpan('wander');
    const commitSpan = bodySpan('attack');
    const restFins = finSwingRange(creature, renderer, 'wander');
    const commitFins = finSwingRange(creature, renderer, 'attack');
    // The commit posture widens the body (request §13.5 "sudden changes in
    // posture when alert") and spreads the fins (the visible telegraph,
    // request §48 "predators visibly commit to attack before contact").
    expect(commitSpan, 'the commit widens the body silhouette').toBeGreaterThan(restSpan);
    expect(commitFins, 'the commit spreads the fins').toBeGreaterThan(restFins * 1.2);
  });
});
