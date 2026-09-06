/**
 * crafts — recipes into `EquipmentDef` capabilities from the player's
 *   material pool (request §9, §62).
 *
 * archetype: service-provider
 * owns: the craft rules — `canCraft` (affordability), `craft` (subtract
 *   the cost from a material pool, apply the `EquipmentDef`, return the
 *   outcome), and `applyEquipment` (apply one item's effects to a
 *   `Player`: oxygen / cargo / speed / capabilities).
 * not own: the recipes / items (content), the material pool or the
 *   equipment list (the simulation owns those and passes them in).
 * invariant: `craft` mutates the pool and player only when the recipe is
 *   affordable and not already owned — an unaffordable or unknown craft
 *   is rejected with no state change.
 * fails when: `craft` is given a missing recipe — returns
 *   `reason: 'unknown'` (no state change).
 */
import type { EquipmentDef } from '../player/equipment';
import type { Player } from '../player/Player';

export type CraftReason = 'ok' | 'insufficient' | 'unknown' | 'alreadyOwned' | 'notAtBase';

export interface CraftResult {
  crafted: boolean;
  reason: CraftReason;
}

export function applyEquipment(player: Player, def: EquipmentDef): void {
  if (def.oxygenBonus) player.o2Max += def.oxygenBonus;
  if (def.cargoBonus) player.cargo.capacity += def.cargoBonus;
  if (def.speedBonus) player.speedMult *= def.speedBonus;
  for (const cap of def.capabilities ?? []) player.capabilities.add(cap);
}

export function canCraft(available: Record<string, number>, def: EquipmentDef): boolean {
  for (const [material, count] of Object.entries(def.cost)) {
    if ((available[material] ?? 0) < count) return false;
  }
  return true;
}

export function craft(
  player: Player,
  pool: Record<string, number>,
  def: EquipmentDef | undefined,
  owned: Set<string>,
): CraftResult {
  if (def === undefined) return { crafted: false, reason: 'unknown' };
  if (owned.has(def.id)) return { crafted: false, reason: 'alreadyOwned' };
  if (!canCraft(pool, def)) return { crafted: false, reason: 'insufficient' };
  for (const [material, count] of Object.entries(def.cost)) {
    pool[material] = (pool[material] ?? 0) - count;
    if (pool[material] <= 0) delete pool[material];
  }
  applyEquipment(player, def);
  return { crafted: true, reason: 'ok' };
}
