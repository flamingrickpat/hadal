/**
 * holds — the single cargo capacity for carried mass (request §7).
 *
 * archetype: information-holder
 * owns: the `cargo.capacity` / `cargo.used` pair — one number, no
 *   slot grid (request §7: "a single capacity number rather than slot
 *   Tetris").
 * not own: item definitions or recipes — the resource system (WI-03)
 *   adds to and subtracts from `used`.
 * invariant: `used <= capacity`.
 * fails when: a caller sets `used` above `capacity` — the collector
 *   must clamp before adding.
 */
export interface Cargo {
  capacity: number;
  used: number;
}

export function createCargo(capacity: number): Cargo {
  return { capacity, used: 0 };
}
