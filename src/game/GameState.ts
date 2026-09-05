/**
 * holds — mutable session state.
 *
 * archetype: information-holder
 * owns: the live session clock (`timeSec`), advanced only through
 *   `tick()`.
 * not own: persistence (`save.ts`, request §42), rendering, or input.
 * invariant: `timeSec` only advances forward, in exactly `FIXED_DT`
 *   increments per tick — the simulation clock, not wall time.
 * fails when: a caller mutates the fields directly instead of going
 *   through `tick()`, breaking clock monotonicity.
 */
export class GameState {
  timeSec = 0;

  tick(dt: number): void {
    this.timeSec += dt;
  }
}
