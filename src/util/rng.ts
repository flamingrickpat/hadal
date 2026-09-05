/**
 * problem — ambient systems (schools, particles, scatter) need randomness
 *   that is identical across runs; solution — a deterministic seeded PRNG
 *   stream (request §61).
 *
 * archetype: service-provider
 * owns: seeded 32-bit PRNG streams.
 * not own: never use for critical gates, critical resources, major
 *   reveals, or the lore sequence — those are authored data, not
 *   randomness (request §61, §4.4).
 * invariant: same seed gives the same sequence in every environment;
 *   no Math.random, no Date.
 * fails when: a caller needs more than a uint32 seed — the seed is one
 *   uint32.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
