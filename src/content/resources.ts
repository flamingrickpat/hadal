/**
 * holds — the core material families the player harvests (request §8).
 *
 * archetype: information-holder
 * owns: the material family catalog (`MATERIALS`) — one core family to
 *   start (request §8: 4–6 families, not 25 items). `salvage` is the
 *   first; the rest grow in WI-08.
 * not own: recipes or item effects (`recipes.ts` / `items.ts`) and node
 *   placement (`worldData.ts`) — those reference these material IDs.
 * invariant: every material ID referenced by a recipe or a resource node
 *   exists here.
 * fails when: a recipe or node references a missing material ID — caught
 *   by the critical-path validator (WI-08), not here.
 */
export interface MaterialDef {
  id: string;
  name: string;
}

export const MATERIALS: readonly MaterialDef[] = [
  { id: 'salvage', name: 'Salvage Metal' },
];

export const MATERIAL_IDS: ReadonlySet<string> = new Set(MATERIALS.map((m) => m.id));
