# WI-07c Balance Tuning Probes (item-implementer scratch)

Answers: what does a blind/expert playthrough actually take, and is the
world reachable and balanced as tuned?

- `count-content.ts` — counts world chunks, exits, resource nodes,
  creature spawns, and triggers to verify world generation.
- `debug-craft.ts` — tests the crafting system with a scripted scenario.
- `test-craft.ts` — quick check of resource gathering and basic crafting.
- `full-blind-playthrough.ts` — headless blind playthrough scenario that
  explores everything, collects all resources, and crafts all upgrades
  (target 90-120 min).
- `expert-playthrough.ts` — headless expert playthrough scenario that
  knows optimal paths and prioritizes efficiently (target 55-75 min).

These probes validate the O2_MAX tuning and balance constants described
in `../../implementation/WI-07c-implementation.md`.
