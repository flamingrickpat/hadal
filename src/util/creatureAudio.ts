/**
 * problem — major creatures need procedural sound profiles drawn from the
 *   section 58 vocabulary (clicks, sub-bass, scraping, resonant harmonics,
 *   not everything roaring) and must be audible well before visible; solution
 *   — a pure, Node-testable creature audio profile data module (one entry per
 *   major-creature id with vocabulary tag and per-band cue lead-time values)
 *   that the AudioSystem service-provider reads to emit early cues using
 *   procedural WebAudio, extending the existing audio data seam alongside
 *   AUDIO_STOPS (request §19, §27, §58).
 *
 * archetype: information-holder
 * owns: the creature sound profile data (vocabulary tag per creature,
 *   per-band cue lead-time multipliers); the SECTION_58_VOCABULARY set;
 *   the CUE_LEAD_TIME_BANDS constant.
 * not own: the AudioContext or WebAudio node synthesis (AudioSystem),
 *   the creature roster definitions (hiddenCreatures), the visual band
 *   visibility (band.ts) — this module is pure data that those systems
 *   read and consume.
 * fails when: none — pure data module.
 * invariant: every registered major creature id (HIDDEN_CREATURES) has an
 *   entry in CREATURE_AUDIO_PROFILES with a valid section 58 vocabulary tag
 *   and exactly 6 per-band cue lead-time values, one per depth band stop.
 */
import { BAND_STOPS } from '../render/band';

/** The section 58 sound vocabulary tags for creature calls. */
export const SECTION_58_VOCABULARY = new Set([
  'clicks',
  'sub-bass',
  'scraping',
  'resonant harmonics',
  'chittering',
  'creaking',
  'groaning',
  'popping',
  'ratcheting',
  'snapping',
  'squeaking',
  'thumping',
  'trilling',
  'whooshing',
]);

/**
 * The cue lead-time multipliers per band (multiplied by the band's final
 * visibility value to get the distance at which the creature becomes
 * audible before visible). The multiplier grows with depth because
 * visibility is tighter and audio carries better in denser water.
 */
export const CUE_LEAD_TIME_BANDS = [
  { multiplier: 1.3, note: 'surface (band 0)' },
  { multiplier: 1.5, note: 'coast (band 1)' },
  { multiplier: 2.0, note: 'mid band 1 (band 2)' },
  { multiplier: 2.5, note: 'mid band 2 (band 3)' },
  { multiplier: 3.0, note: 'mid band 3 (band 4)' },
  { multiplier: 3.5, note: 'deep (band 5)' },
];

/** A creature's procedural sound profile data. */
export interface CreatureAudioProfile {
  /** The section 58 vocabulary tag for this creature's call. */
  vocabulary: string;
  /** The per-band cue lead-time values (world units, beyond visibility). */
  cueLeadTimePerBand: readonly number[];
}

/**
 * The creature sound profile data: one entry per major-creature id with a
 * section 58 vocabulary tag and per-band cue lead-time values.
 */
export const CREATURE_AUDIO_PROFILES: Record<string, CreatureAudioProfile> = {
  // Tier 1 — neutral fauna
  'T-01': { vocabulary: 'clicks', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  'T-02': { vocabulary: 'chittering', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  'T-03': { vocabulary: 'snapping', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  'T-05': { vocabulary: 'trilling', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  'T-06': { vocabulary: 'squeaking', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  'T-13': { vocabulary: 'popping', cueLeadTimePerBand: [325, 180, 130, 120, 114, 84] },
  // Tier 2 — interactive fauna
  'T-08': { vocabulary: 'ratcheting', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  'T-09': { vocabulary: 'whooshing', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  'T-10': { vocabulary: 'creaking', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  'T-11': { vocabulary: 'thumping', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  'T-27': { vocabulary: 'popping', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  'T-31': { vocabulary: 'chittering', cueLeadTimePerBand: [650, 360, 260, 240, 228, 168] },
  // Tier 3 — predators
  'T-14': { vocabulary: 'resonant harmonics', cueLeadTimePerBand: [975, 540, 390, 360, 342, 252] },
  'T-15': { vocabulary: 'groaning', cueLeadTimePerBand: [975, 540, 390, 360, 342, 252] },
  'T-16': { vocabulary: 'sub-bass', cueLeadTimePerBand: [975, 540, 390, 360, 342, 252] },
  'T-17': { vocabulary: 'snapping', cueLeadTimePerBand: [975, 540, 390, 360, 342, 252] },
  'T-18': { vocabulary: 'trilling', cueLeadTimePerBand: [975, 540, 390, 360, 342, 252] },
  // Tier 4 — colossal / special organisms
  'T-19': { vocabulary: 'whooshing', cueLeadTimePerBand: [1300, 720, 520, 480, 456, 336] },
  'T-20': { vocabulary: 'sub-bass', cueLeadTimePerBand: [1300, 720, 520, 480, 456, 336] },
  'T-22': { vocabulary: 'creaking', cueLeadTimePerBand: [1300, 720, 520, 480, 456, 336] },
  'T-23': { vocabulary: 'resonant harmonics', cueLeadTimePerBand: [1300, 720, 520, 480, 456, 336] },
  'T-25': { vocabulary: 'ratcheting', cueLeadTimePerBand: [1300, 720, 520, 480, 456, 336] },
};

/** Compute the cue distance for a creature in a band from its lead-time multiplier. */
export function cueDistanceForBand(visibility: number, multiplier: number): number {
  return Math.floor(visibility * multiplier);
}

/** Get the cue lead time for a creature in a specific depth band. */
export function cueLeadTimeForBand(profile: CreatureAudioProfile, bandIndex: number): number {
  const idx = Math.min(bandIndex, CUE_LEAD_TIME_BANDS.length - 1);
  const band = CUE_LEAD_TIME_BANDS[idx]!;
  const vis = BAND_STOPS[idx]!.visibility;
  return cueDistanceForBand(vis, band.multiplier) - vis;
}
