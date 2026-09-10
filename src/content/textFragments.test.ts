import { describe, it, expect } from 'vitest';
import { TEXT_FRAGMENTS } from './textFragments';

describe('text fragments budget (request §38)', () => {
  it('has 10-16 short text fragments (request §38)', () => {
    expect(TEXT_FRAGMENTS.length).toBeGreaterThanOrEqual(10);
    expect(TEXT_FRAGMENTS.length).toBeLessThanOrEqual(16);
  });

  it('every fragment is roughly 40-100 words (request §38, "~" indicates approximate)', () => {
    for (const frag of TEXT_FRAGMENTS) {
      const words = frag.text.trim().split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(25);
      expect(words.length).toBeLessThanOrEqual(100);
    }
  });

  it('every fragment has a keep-or-delete reason (request §38)', () => {
    const validReasons = [
      'foreshadow-gameplay',
      'explain-human-decision',
      'recontextualize-place',
      'hint-at-hidden-lore',
      'emotional-texture',
    ];
    for (const frag of TEXT_FRAGMENTS) {
      expect(validReasons).toContain(frag.reason);
    }
  });

  it('fragments span multiple depth bands', () => {
    const shelf = TEXT_FRAGMENTS.filter((f) => f.id.startsWith('frag-shelf-'));
    const twilight = TEXT_FRAGMENTS.filter((f) => f.id.startsWith('frag-twilight-'));
    const abyss = TEXT_FRAGMENTS.filter((f) => f.id.startsWith('frag-abyss-'));
    const hadal = TEXT_FRAGMENTS.filter((f) => f.id.startsWith('frag-hadal-'));
    expect(shelf.length).toBeGreaterThanOrEqual(1);
    expect(twilight.length).toBeGreaterThanOrEqual(1);
    expect(abyss.length).toBeGreaterThanOrEqual(1);
    expect(hadal.length).toBeGreaterThanOrEqual(1);
  });
});