/**
 * holds — tuning constants (timestep, camera, world scale, base/harvest/death).
 *
 * archetype: information-holder
 * owns: the single canonical tuning numbers every later system reads:
 *   the fixed timestep, the design screen size, the camera framing, the
 *   world extent, the player movement / meter / camera-lag values
 *   (request §6, §7, §16), the harvesting/base-interact radius, the
 *   surface-base region radius, and the death resource-loss fraction
 *   (request §5, §8, §25).
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

// Player movement (request §6): deliberate, slightly heavy, inertial.
export const PLAYER_RADIUS = 30; // request §4.1: player width 45–60
export const PLAYER_ACCEL_H = 600; // separate horizontal acceleration
export const PLAYER_ACCEL_V = 560; // separate vertical acceleration
export const PLAYER_DRAG_RATE = 2; // per-second exponential drag rate
export const BOOST_ACCEL_MULT = 2.2; // request §6: boost once unlocked
export const BOOST_DRAG_MULT = 0.55;
export const FACING_SPEED_SCALE = 200; // speed at which velocity fully weights the body facing
export const FACING_MAX_WEIGHT = 0.65; // "slightly toward velocity/aim" blend cap
export const FACING_ROT_RATE = 6; // body rotation lerp rate, per second

// Player meters (request §7): oxygen is the dive timer, health is 0–100.
export const O2_MAX = 180; // seconds of baseline dive time
export const O2_DRAIN_PER_SEC = 1;
export const O2_BOOST_MULT = 1.75; // drains faster when boosting
export const O2_INJURY_THRESHOLD = 25; // health below this counts as injured
export const O2_INJURY_MULT = 1.5; // drains faster when injured
export const O2_ZERO_HP_DRAIN_PER_SEC = 5; // zero-O2 health-drain state
export const O2_REGEN_PER_SEC = 12; // refilling near the surface
export const HP_MAX = 100;
export const HP_REGEN_PER_SEC = 8;
export const SURFACE_REFILL_DEPTH = 100; // within this of y=0, meters refill
export const CARGO_BASE_CAPACITY = 10; // request §7: single capacity number

// Camera (request §16): smooth follow with 0.12–0.2 s lag.
export const CAMERA_LAG_SEC = 0.15;
// The gameplay plane the player and terrain are drawn at (request §13: z is
// visual layering only; the beam at 12 and the gradient at -50 bracket it).
export const PLAYER_PLANE_Z = 10;

// Base + harvesting (request §5, §8): tiny surface platform the player
// returns to; one core material harvested by swimming near a node + E.
export const INTERACT_RADIUS = 70; // harvest / interact distance (player radius 30 + margin)
export const BASE_RADIUS = 260; // surface-base region radius (request §5)

// Death / respawn (request §25): at most a modest fraction of unbanked
// resources is lost; permanent upgrades and banked resources are kept.
export const DEATH_RESOURCE_LOSS_FRACTION = 0.3;
