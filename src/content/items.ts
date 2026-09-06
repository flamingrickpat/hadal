/**
 * holds — the item catalog: every permanent equipment item by ID
 *   (request §62), combining the starter gear and the craft recipes.
 *
 * archetype: information-holder
 * owns: `EQUIPMENT` (the full item catalog) and `findItem` (ID lookup).
 * not own: the `EquipmentDef` / `Capability` types and the starter-gear
 *   seed (`equipment.ts`), or the recipes (`recipes.ts`).
 * invariant: every recipe ID and every starter ID resolves here.
 * fails when: `findItem` is given an unknown item ID — returns null.
 */
import { STARTER_GEAR, type EquipmentDef } from '../player/equipment';
import { RECIPES } from './recipes';

export const EQUIPMENT: readonly EquipmentDef[] = [...STARTER_GEAR, ...RECIPES];

export const ITEM_BY_ID: ReadonlyMap<string, EquipmentDef> = new Map(
  EQUIPMENT.map((item) => [item.id, item]),
);

export function findItem(id: string): EquipmentDef | null {
  return ITEM_BY_ID.get(id) ?? null;
}
