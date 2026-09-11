/**
 * problem — the sparse music feature (request §58) needs automated
 *   verification; solution — a focused AudioSystem test suite that
 *   validates music moment definitions, music moment playback, the
 *   depth band motif, and the no-90-second-loop property.
 *
 * archetype: service-provider test
 * owns: the automated verification of the sparse music feature: music
 *   moment data definitions, procedural playback, depth band motifs,
 *   and the no-90-second-loop constraint.
 * not own: creature audio (WI-06e-b), depth mixing (WI-06e-a), a11y
 *   controls (WI-06g), visual changes, shake/camera (WI-06d).
 * fails when: a music moment definition is malformed, a music moment
 *   cannot be played, or the 90-second loop property is violated.
 */
/**
 * problem — the sparse music feature (request §58) needs automated
 *   verification; solution — a focused Vitest test suite for the
 *   music moment data definitions (the AudioSystem playback tests
 *   live in the browser harness at tests/browser/sparse-music.test.mjs).
 *
 * archetype: information-holder test
 * owns: the automated verification of the MUSIC_MOMENTS data
 *   definitions: valid types, unique cueIds, required story cues,
 *   and the no-90-second-loop property.
 * not own: the AudioSystem playback itself (browser harness), depth
 *   mixing (WI-06e-a), creature audio (WI-06e-b).
 * fails when: a music moment definition is malformed, cueIds collide,
 *   required story cues are missing, or a moment exceeds the sparse
 *   music duration constraint.
 */
import { describe, test, expect } from 'vitest';
import { MUSIC_MOMENTS } from '../util/audio';

describe('sparse music data definitions (request §58)', () => {
  test('MUSIC_MOMENTS is a non-empty array of valid definitions', () => {
    expect(MUSIC_MOMENTS.length).toBeGreaterThan(0);
    for (const def of MUSIC_MOMENTS) {
      expect(def.id).toBeTruthy();
      expect(def.cueId).toBeTruthy();
      expect(['ambient-pad', 'harmonic-swell', 'drone-chord', 'sparse-theme']).toContain(def.type);
      expect(def.scale).toBeGreaterThan(0.05);
      expect(def.scale).toBeLessThanOrEqual(1.0);
      expect(def.duration).toBeGreaterThan(0.5);
      expect(def.duration).toBeLessThan(60);
    }
  });

  test('MUSIC_MOMENTS has unique cueIds (no duplicate trigger mappings)', () => {
    const cueIds = new Set(MUSIC_MOMENTS.map((m) => m.cueId));
    expect(cueIds.size).toBe(MUSIC_MOMENTS.length);
  });

  test('MUSIC_MOMENTS contains the final theme cue (ending-triggered)', () => {
    const hasEnding = MUSIC_MOMENTS.some((m) => m.cueId === 'ending-triggered' && m.type === 'sparse-theme');
    expect(hasEnding).toBe(true);
  });

  test('MUSIC_MOMENTS contains all major story beat cues', () => {
    const storyCues = ['beat-s1-lights', 'beat-s2-creak', 'beat-s3-pulse', 'beat-s4-heartbeat', 'beat-s5-plates'];
    for (const cue of storyCues) {
      expect(MUSIC_MOMENTS.some((m) => m.cueId === cue), `missing story cue: ${cue}`).toBe(true);
    }
  });

  test('no 90-second loop: all moments are short (< 30 seconds)', () => {
    for (const def of MUSIC_MOMENTS) {
      expect(def.duration, `moment ${def.id} too long`).toBeLessThan(30);
    }
  });
});
