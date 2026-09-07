/**
 * holds — the authored soft equipment gates (request §4.3) as data only: the
 *   `GateDef` shape and the `GATES` catalog. The gate *wiring* (querying the
 *   player's capabilities/depth against them) lands in WI-08; this file is the
 *   canonical data the world and the validator reference.
 *
 * archetype: information-holder
 * owns: the `GateDef` shape (a soft gate: a condition kind, the depth band it
 *   applies to, and the capability that clears it) and the authored `GATES` —
 *   pressure, darkness, current, narrow-passage, and creature-territory gates
 *   (request §4.3). Data only; nothing reads these yet (wiring is WI-08).
 * not own: the gate evaluation (WI-08) or the `Capability` type
 *   (`player/equipment.ts`, referenced as a string to keep this data-only).
 * invariant: each gate id is unique; each `clears` references a capability id
 *   from request §62; no gate is an arbitrary invisible wall (request §4.3).
 * fails when: a gate references an unknown capability id — caught by the
 *   critical-path validator (WI-08), not here.
 */
export interface GateDef {
  id: string;
  /** The soft-gate kind (request §4.3): pressure, darkness, current, narrow, territory. */
  kind: 'pressure' | 'darkness' | 'current' | 'narrow' | 'territory';
  /** The depth band the gate applies in. */
  band: number;
  /** The capability that clears the gate (request §62 capability id). */
  clears: string;
}

/** The authored soft equipment gates (request §4.3); data only, wired in WI-08. */
export const GATES: readonly GateDef[] = [
  { id: 'gate-twilight-dark', kind: 'darkness', band: 3, clears: 'spectralLight' },
  { id: 'gate-twilight-current', kind: 'current', band: 3, clears: 'boost' },
  { id: 'gate-abyss-pressure', kind: 'pressure', band: 4, clears: 'deepPressure' },
  { id: 'gate-abyss-narrow', kind: 'narrow', band: 4, clears: 'cutter' },
  { id: 'gate-hadal-territory', kind: 'territory', band: 5, clears: 'decoy' },
];
