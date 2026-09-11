/**
 * holds — the distant-motion impulse trigger parameters (request §48).
 *
 * archetype: information-holder
 * owns: the impulse trigger distance band (distant large motion must be beyond
 *   this), the motion threshold (below this, the motion is not large enough),
 *   the nudge amplitude (low, presentation-only), and the decay time (short).
 * not own: no state — pure data.
 * invariant: all values are immutable constants.
 * fails when: a caller needs a new impulse tuning value — add it here rather
 *   than inlining it.
 */

/**
 * Distant large motion must be beyond this distance from the camera to
 * trigger an impulse (request §48: "distant large motion"). Inside this
 * band, the motion is too close and feels immediate, not a distant rumble.
 *
 * World units: 2000 (within the CREATURE_AI_RANGE of 3000 so distant
 * motion is still simulated).
 */
export const IMPULSE_TRIGGER_DISTANCE = 2000;

/**
 * Below this motion value, the motion is not large enough to trigger an
 * impulse. The motion metric is velocity * bodyExtent — a fast small
 * creature and a slow large creature both register as "large motion" if
 * their product is above this threshold (request §48: "big creature
 * passing far away" or "environmental event").
 *
 * World units: 10000 (e.g., velocity 100 * extent 100, or velocity 200 *
 * extent 50).
 */
export const IMPULSE_MOTION_THRESHOLD = 10000;

/**
 * The low-amplitude camera nudge magnitude (request §48: "low-amplitude
 * camera nudge"). Presentation only — no steering or balance effect.
 *
 * World units: 15 (subtle).
 */
export const IMPULSE_NUDGE_AMPLITUDE = 15;

/**
 * The decay time for the impulse nudge (request §48: "short decay").
 *
 * Seconds: 0.5.
 */
export const IMPULSE_DECAY_TIME = 0.5;
