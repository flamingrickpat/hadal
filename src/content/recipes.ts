/**
 * holds — the authored craft recipes (request §9, §54): a one-sentence
 *   effect plus ingredient cost, as `EquipmentDef` data (request §62).
 *
 * archetype: information-holder
 * owns: the craftable permanent upgrades (`RECIPES`) — the tier-1 first
 *   upgrades the workbench offers. `tank-1` is the oxygen capacity
 *   upgrade; `fins-1` adds the `boost` capability.
 * not own: the `EquipmentDef` / `Capability` types (`equipment.ts`) and
 *   the material families (`resources.ts`).
 * invariant: each recipe ID is unique and its cost references only
 *   material IDs that exist in `resources.ts`.
 * fails when: a recipe references a missing material ID — caught by the
 *   critical-path validator (WI-08), not here.
 */
import type { EquipmentDef } from '../player/equipment';

export const RECIPES: readonly EquipmentDef[] = [
  {
    id: 'tank-1',
    name: 'Tank Mk II',
    description: '+65 s oxygen capacity.',
    cost: { salvage: 6 },
    oxygenBonus: 65,
  },
  {
    id: 'fins-1',
    name: 'Impulse Fins',
    description: 'Stronger acceleration; unlocks boost.',
    cost: { salvage: 8 },
    speedBonus: 1.3,
    capabilities: ['boost'],
  },
];

export const RECIPE_BY_ID: ReadonlyMap<string, EquipmentDef> = new Map(
  RECIPES.map((r) => [r.id, r]),
);
