/**
 * holds — tuning constants (timestep, camera, world scale).
 *
 * archetype: information-holder
 * owns: the single canonical tuning numbers every later system reads:
 *   the fixed timestep, the design screen size, the camera framing, and
 *   the world extent.
 * not own: any state or behavior — pure data.
 * invariant: all values are immutable `const` numbers; a shared tuning
 *   value lives here and is inlined nowhere else.
 * fails when: a system inlines a shared number instead of importing it —
 *   add the constant here.
 */
export const FIXED_DT = 1 / 60; // request §30
export const MAX_FRAME_DT = 0.1; // request §30: clamp tab-stall gaps
export const SCREEN_WIDTH = 1920; // request §34: design at 1080p
export const SCREEN_HEIGHT = 1080;
export const CAMERA_VIEW_WIDTH = 2000; // request §4.1: 1800–2300 world units at 16:9
export const WORLD_WIDTH = 24000; // request §4.1: 18,000–28,000 wide
export const WORLD_DEPTH = 12000; // request §4.1: deepest point ~-9,000 to -12,000
