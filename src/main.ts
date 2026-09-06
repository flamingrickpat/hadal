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
  debugPanel.tick(now);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
