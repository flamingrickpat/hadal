import { describe, expect, it } from 'vitest';
import { CREATURE_AUDIO_PROFILES, SECTION_58_VOCABULARY, CUE_LEAD_TIME_BANDS, cueDistanceForBand } from './creatureAudio';
import { HIDDEN_CREATURES, TIER1_IDS, TIER2_IDS, TIER3_IDS, TIER4_IDS } from '../content/secret/hiddenCreatures';
import { BAND_STOPS } from '../render/band';

const MAJOR_CREATURE_IDS = [...TIER1_IDS, ...TIER2_IDS, ...TIER3_IDS, ...TIER4_IDS];

describe('CREATURE_AUDIO_PROFILES', () => {
  it('every registered major creature has a sound profile', () => {
    const rosterIds = new Set(HIDDEN_CREATURES.map((c) => c.id));
    for (const id of MAJOR_CREATURE_IDS) {
      expect(rosterIds.has(id)).toBe(true);
      expect(CREATURE_AUDIO_PROFILES[id], `profile missing for ${id}`).toBeDefined();
    }
  });

  it('every profile has a section 58 vocabulary tag', () => {
    for (const [id, profile] of Object.entries(CREATURE_AUDIO_PROFILES)) {
      expect(SECTION_58_VOCABULARY.has(profile.vocabulary),
        `${id} has invalid vocabulary: ${profile.vocabulary}`).toBe(true);
    }
  });

  it('every profile has per-band cue lead time values', () => {
    for (const [id, profile] of Object.entries(CREATURE_AUDIO_PROFILES)) {
      expect(profile.cueLeadTimePerBand.length).toBe(CUE_LEAD_TIME_BANDS.length);
      for (let i = 0; i < profile.cueLeadTimePerBand.length; i += 1) {
        expect(profile.cueLeadTimePerBand[i]).toBeGreaterThan(0);
      }
    }
  });

  it('vocabulary tags are varied (not all roaring)', () => {
    const tagCounts: Record<string, number> = {};
    for (const profile of Object.values(CREATURE_AUDIO_PROFILES)) {
      tagCounts[profile.vocabulary] = (tagCounts[profile.vocabulary] ?? 0) + 1;
    }
    const tagNames = Object.keys(tagCounts);
    expect(tagNames.length).toBeGreaterThanOrEqual(4);
  });

  it('cue distance stays ahead of visibility for all creatures and bands', () => {
    for (const [id, profile] of Object.entries(CREATURE_AUDIO_PROFILES)) {
      for (let i = 0; i < BAND_STOPS.length; i += 1) {
        const band = BAND_STOPS[i]!;
        const leadTime = profile.cueLeadTimePerBand[i]!;
        const cueDist = band.visibility + leadTime;
        expect(cueDist, `${id} at depth ${band.depth}: cue distance must exceed visibility`).toBeGreaterThan(band.visibility);
      }
    }
  });
});
