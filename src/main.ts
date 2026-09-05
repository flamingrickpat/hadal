/**
 * boot — assemble renderer, game, and the fixed-step frame loop.
 *
 * archetype: service-provider
 * owns: the one-time startup wiring — `#game` container -> `Renderer`
 *   -> `Game` -> frame loop start.
 * not own: simulation or rendering details — those belong to `Game` and
 *   `Renderer`; main runs exactly once at page load.
 * fails when: the `#game` container is missing, or WebGL2 is
 *   unavailable in the host browser — boot throws and the page fails
 *   visibly.
 */
import { Game } from './game/Game';
import { Renderer } from './render/Renderer';

const container = document.getElementById('game');
if (container === null) {
  throw new Error('#game container missing — see index.html');
}

const renderer = new Renderer(container);
const game = new Game(renderer);
game.start();
