# WI-03: Surface base, resource, crafting, save, death/respawn, and debug

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-02

## Goal

Complete Phase 1 greybox: a small surface base the player returns to, one harvestable resource, one craftable upgrade, a versioned `localStorage` save with death/respawn, and a working debug panel — so the player can dive, gather, surface, craft, and go farther.

## Vision Link

Request §5 (tiny surface base + stations + refill/save on return), §7 (single cargo capacity), §8 (one core material family to start), §9 (starter + first oxygen/propulsion upgrade), §25 (death/respawn + autosave), §42 (versioned `SaveGameV1`), §33 (debug panel), §53 (first-10-minute tutorial loop). §45 "can craft first upgrade … death respawns properly" is met here.

## Acceptance Criteria

- [ ] A small surface platform/base exists at the start with the required stations: workbench, storage, dive terminal, radio/contract terminal, launch edge (request §5); no large hub to walk around.
- [ ] One core material can be harvested by swimming near a node + `E` (request §5/§8/§53); a first oxygen or propulsion upgrade is craftable at the workbench with one click (request §9, §54).
- [ ] Returning to base refills oxygen/health, restores health, saves automatically, banks resources, and updates one or two concise world/story lines; surfacing-to-diving turnaround is under 30 seconds (request §5).
- [ ] The craftable upgrade visibly changes a capability (e.g., +oxygen capacity or +acceleration) and is a real `EquipmentDef` (request §9, §62).
- [ ] Inventory uses a single cargo capacity number, not slot Tetris; permanent key objects do not consume cargo (request §7).
- [ ] Death respawns at the surface base, keeps permanent upgrades and key discoveries, and loses at most a modest fraction of unbanked resources (request §25).
- [ ] Save is a versioned `SaveGameV1` in `localStorage` (request §42); autosaves on base return, major unlocks, and before the final descent; a malformed save resets or backs up gracefully (request §25, §70).
- [ ] A debug panel (`?debug=1` or backtick+`F2`) exposes noclip, teleport-to-chunk, give resources, and reset save (request §33); no creature names/secret descriptions appear in normal UI.

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Base stations + launch edge | manual (browser) | stand on platform; all §5 stations present and usable |
| Harvest + craft + capability change | manual (browser) + workflow | harvest node, craft upgrade, confirm the capability changes; `EquipmentDef` + recipe data present |
| Refill/save on return | manual (browser) | surface; O2/health refill; save written to `localStorage` |
| Death/respawn | manual (browser) | force a death; respawn at base with upgrades kept, some unbanked resources lost |
| Versioned save + graceful malformed save | automated | Vitest: serialize/deserialize round-trip; feed a malformed save; assert reset/backup path |
| Debug panel | manual (browser) | `?debug=1`; noclip/teleport/give-resources/reset-save all work |

## Tests To Write First

- A Vitest test for `SaveGameV1` serialize/deserialize round-trip, version field, and malformed-save handling (request §42, §70).
- A Vitest test that a crafted upgrade mutates the player's capability set (request §62).

## Live Or External Verification

In `npm run dev`: harvest a node, surface, craft the first upgrade, confirm the capability changed, dive again; then force a death and confirm respawn; reload the page and confirm the save persists.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev` (state persists in `localStorage`)
- Health: base reachable, craft works, save persists across reload, no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/game/save.ts` (versioned `SaveGameV1`, request §42), `src/world/worldData.ts` (base + greybox), `src/player/inventory.ts`, `src/player/equipment.ts`
- `src/systems/CraftingSystem.ts` (request §9), `src/content/recipes.ts`, `src/content/resources.ts`, `src/content/items.ts`, `src/content/dialogue.ts`
- `src/ui/menu.ts`, `src/ui/hud.ts`, `src/util/debug.ts` (request §33)
- request §5, §7, §8, §9, §25, §33, §42, §53, §54, §62

## Architecture And Integration Constraints

New files, L1 + archetype:

- `src/game/save.ts` — `persists — versioned SaveGameV1 to/from localStorage`; interfacacer (on-disk format ↔ in-memory object).
- `src/systems/CraftingSystem.ts` — `crafts — recipes into EquipmentDef capabilities from inventory`; service-provider.
- `src/content/recipes.ts`, `src/content/resources.ts`, `src/content/items.ts` — `hold — authored craft/ingredient/item data`; information-holder.
- `src/util/debug.ts` — `exposes — a hidden developer panel`; controller.

Constraints: reuse the §42 `SaveGameV1` and §62 `EquipmentDef`/`Capability` types (never clone them). No money currency unless narratively justified (request §8). The tutorial loop (request §53) is what this work item completes.

## Forbidden Substitute Success

- A base that is a large hub to walk around (request §5 forbids it).
- A "save" that is not versioned or that crashes on a malformed `localStorage` value.
- A craft button that changes no actual capability.

## Expected Project Knowledge Update

Note the save schema version and the exact `localStorage` key in a project note; note the debug-panel toggle key if it differs from the request's suggested default.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.

## Implementer Handoff (from WI-02, 2026-09-05)

The core loop is live: `Game.update(FIXED_DT)` runs controller →
collision → mesh sync → HUD. The player (`Player` state +
`PlayerController` input/integrator/meters) starts at
`PLAYER_START` (1300, −100) in a greybox world (`worldData.ts`
`GREYBOX_WORLD`: seabed, wall at x 2350–2650 with top −520, east
shelf), y = 0 surface, negative = deeper. O2 (180 s baseline) and
health (100) refill within `SURFACE_REFILL_DEPTH` (100) of the
surface; zero-O2 health drain exists; death/respawn is not yet
wired. Starter gear and the `EquipmentDef`/`Capability` shapes live
in `src/player/equipment.ts` (request §62); cargo is one number
(`Player.cargo`, `CARGO_BASE_CAPACITY`). The minimal HUD
(`src/ui/hud.ts`) and the hidden debug panel
(`src/util/debug.ts`, `?debug=1` / backtick+F2, x+depth teleport,
4 Hz readout) exist — extend the panel in place for the rest of
request §33. The greybox chunk data is the refactor target for the
full §17 chunk model; `worldBounds` feeds the camera clamp in
`Renderer.follow`. See the project note
`agents/projects/hadal/notes/20260905-implementer-wi02-world-seams.md`
and `implementation/WI-02-implementation.md`.
