/**
 * holds — equipment definitions (request §62) and the starter gear (request §9 tier 0).
 *
 * archetype: information-holder
 * owns: the canonical `EquipmentDef` / `Capability` shapes, the
 *   starter-gear definitions (tank, work light, salvage knife, simple
 *   harpoon), and `applyStarterGear` which seeds a new `Player`.
 * not own: crafting or the upgrade tree — the crafting system
 *   (WI-03/08) consumes these definitions.
 * invariant: the capability IDs are exactly request §62's union; the
 *   starter gear grants no `boost` and no `sonar`.
 * fails when: a starter tool slot references an ID missing from
 *   `STARTER_GEAR` — the lookup throws for invalid authored data.
 */
import { CARGO_BASE_CAPACITY, HP_MAX, O2_MAX } from '../game/constants';
import type { Player } from './Player';
import { createCargo } from './inventory';

export type Capability =
  | 'sonar'
  | 'cutter'
  | 'boost'
  | 'decoy'
  | 'insulated'
  | 'spectralLight'
  | 'deepPressure';

export interface EquipmentDef {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  oxygenBonus?: number;
  maxDepthBonus?: number;
  cargoBonus?: number;
  speedBonus?: number;
  capabilities?: Capability[];
}

export const STARTER_GEAR: EquipmentDef[] = [
  { id: 'tank-0', name: 'Basic Tank', description: 'Starter dive tank.', cost: {}, oxygenBonus: 0 },
  { id: 'light-0', name: 'Work Light', description: 'Starter work light.', cost: {} },
  { id: 'knife-0', name: 'Salvage Knife', description: 'Cuts through small salvage.', cost: {} },
  { id: 'harpoon-0', name: 'Simple Harpoon', description: 'Lance small prey and break weak salvage.', cost: {} },
];

const STARTER_TOOL_SLOTS = ['knife-0', 'light-0', 'harpoon-0'];

const HARPOON_GEAR = STARTER_GEAR.find((gear) => gear.id === 'harpoon-0');
if (HARPOON_GEAR === undefined) throw new Error('STARTER_GEAR must define the harpoon');

/** The starter harpoon (request §9 tier 0): the lance tool (request §10). */
export const HARPOON: EquipmentDef = HARPOON_GEAR;

export function applyStarterGear(player: Player): void {
  const tank = STARTER_GEAR[0];
  if (tank === undefined) throw new Error('STARTER_GEAR must define the tank');
  player.o2Max = O2_MAX + (tank.oxygenBonus ?? 0);
  player.o2 = player.o2Max;
  player.health = HP_MAX;
  player.tools = STARTER_TOOL_SLOTS.map((id) => {
    const def = STARTER_GEAR.find((gear) => gear.id === id);
    if (def === undefined) throw new Error(`starter tool ${id} missing from STARTER_GEAR`);
    return def.name;
  });
  player.toolIndex = 0;
  player.cargo = createCargo(CARGO_BASE_CAPACITY);
  for (const gear of STARTER_GEAR) {
    for (const cap of gear.capabilities ?? []) player.capabilities.add(cap);
  }
}
