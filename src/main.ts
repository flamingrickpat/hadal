import { Game } from './game/Game';
import { FIXED_DT } from './game/constants';
import { stepCountSince } from './game/frame';
import { Renderer } from './render/Renderer';
import { DebugPanel } from './util/debug';
import './ui/styles.css';

const renderer = new Renderer(document.getElementById('game')!);
const game = new Game(renderer);
const debugPanel = new DebugPanel(game);

// Fixed-step frame loop (request §30): real time is drained from an
// accumulator into whole FIXED_DT simulation steps, so the simulation
// cadence is independent of the display refresh rate; exactly one render
// runs per display frame.
let last: number | null = null;
let accumulator = 0;

// WI-07d: real browser render FPS measurement.
// The telemetry collector's FPS field measures simulation step rate (always 60),
// not actual browser render frame rate. This counter measures wall-clock time
// between consecutive requestAnimationFrame calls to compute actual render FPS.
let renderFpsFrames = 0;
let renderFpsLastTime = 0;
let currentRenderFps = 60;
const RENDER_FPS_WINDOW_SEC = 1;

const updateRenderFps = (now: number): number => {
  renderFpsFrames += 1;
  if (renderFpsLastTime === 0) renderFpsLastTime = now;
  const elapsed = (now - renderFpsLastTime) / 1000;
  if (elapsed >= RENDER_FPS_WINDOW_SEC) {
    currentRenderFps = Math.round((renderFpsFrames / elapsed) * 10) / 10;
    renderFpsFrames = 0;
    renderFpsLastTime = now;
  }
  return currentRenderFps;
};

const frame = (now: number): void => {
  const rawDt = last === null ? 0 : (now - last) / 1000;
  if (last !== null) {
    const { steps, accumulator: next } = stepCountSince(rawDt, accumulator);
    for (let i = 0; i < steps; i += 1) game.update(FIXED_DT);
    accumulator = next;
  }
  last = now;
  renderer.follow(game.player.position);
  game.renderVisuals(Math.min(rawDt, 0.1));
  renderer.render();
  updateRenderFps(now);
  debugPanel.tick(now);
  requestAnimationFrame(frame);
};

// Expose render FPS for testing (§33 debug host).
(window as unknown as Record<string, unknown>).__HADAL_RENDER_FPS__ = () => currentRenderFps;
(window as unknown as Record<string, unknown>).__HADAL_RENDER_FPS_RESET__ = () => {
  renderFpsFrames = 0;
  renderFpsLastTime = 0;
};

// Start the frame loop.
requestAnimationFrame(frame);
