import { Game } from './game/Game';
import { FIXED_DT } from './game/constants';
import { Renderer } from './render/Renderer';
import { DebugPanel } from './util/debug';
import './ui/styles.css';

const renderer = new Renderer(document.getElementById('app')!);
const game = new Game(renderer);
const debugPanel = new DebugPanel(game);

const animate = (now: number): void => {
  game.update(FIXED_DT);
  renderer.follow(game.player.position);
  renderer.render();
  debugPanel.tick(now);
  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
