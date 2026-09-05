/**
 * boot — assemble renderer, game, and the fixed-step frame loop.
 *
 * archetype: service-provider
 * owns: the one-time startup wiring — `#game` container -> `Renderer`
 *   -> `Game` -> frame loop start, plus the hidden debug panel
 *   (request §33) wired to the game's teleport/readout hooks.
 * not own: simulation or rendering details — those belong to `Game` and
 *   `Renderer`; main runs exactly once at page load.
 * fails when: the `#game` container is missing, or WebGL2 is
 *   unavailable in the host browser — boot throws and the page fails
 *   visibly.
 */
import { Game } from './game/Game';
import { Renderer } from './render/Renderer';
import { enableDebugPanel } from './util/debug';

const container = document.getElementById('game');
if (container === null) {
  throw new Error('#game container missing — see index.html');
}

const renderer = new Renderer(container);
const game = new Game(renderer);
enableDebugPanel(document.body, {
  teleport: (x, depth) => game.debugTeleport(x, depth),
  readout: () => game.debugReadout(),
});
game.start();
