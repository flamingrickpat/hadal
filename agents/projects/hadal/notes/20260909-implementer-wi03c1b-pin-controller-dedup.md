---
tags: [creatures, tier-3, controllers, bespoke-controller]
symbols: [pinRestExcept, t14Controller, t16Controller, t17Controller, CreatureController]
---

# Rest-state pin controller pattern (hiddenCreatures.ts)

The per-species "pin" controllers in `src/content/secret/hiddenCreatures.ts`
are one parameterized function, not per-species copies:

`pinRestExcept(armed: CreatureState): CreatureController` holds the
creature in `idle`/`target=null` in every state except its armed state.
Current users: `t14Controller = pinRestExcept('alert')` (held post),
`t16Controller = t17Controller = pinRestExcept('custom')` (inert until
strike/silk). A future non-chase species with the same shape adds a one-line
user; a species whose armed state differs from rest in a non-pinning way
(e.g. T-15's full simulation-side machine) gets its own controller.

Gotcha: the work item contract treats two predators sharing an identical
bespoke controller body as a contract violation — parameterize (one factory)
rather than copy. The load-bearing rule still resolves simulation-side in
`Simulation.applyTier3Interactions`; the controller only pins rest state
(the hook cannot see the player or the ambient pool).
