/**
 * resolves — player/prop/terrain overlaps into separations (request §31).
 *
 * archetype: coordinator
 * participants: `Player` (the moving circle) and `Terrain` (the
 *   segment set); props and creatures join here when they exist.
 * ordering: runs after `PlayerController` integrates the position and
 *   before the mesh sync in `Game.update` — the rendered position is
 *   the resolved one.
 * owns: nothing — a pure per-step resolution pass over the registered
 *   participants.
 * fails when: the terrain set is empty — nothing is resolved, which is
 *   not an error (open water).
 */
import { PLAYER_RADIUS } from '../game/constants';
import type { Player } from '../player/Player';
import type { Terrain } from '../world/terrain';

export class CollisionSystem {
  constructor(
    private readonly player: Player,
    private readonly terrain: Terrain,
  ) {}

  update(): void {
    this.terrain.resolveCircle(this.player.position, PLAYER_RADIUS, this.player.velocity);
  }
}
