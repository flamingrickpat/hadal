# ST-02 work items

Planner-owned work-item specifications for ST-02 (the creature framework):

- `WI-02a.md` — the headless Creature runtime (definition schema,
  steering, sense subscription on the existing WorldSignalBus, generic
  state machine, bespoke controller hook), advanced by the fixed-step
  simulation, with unit tests.
- `WI-02b.md` — the procedural 2.5D creature renderers (spine renderer,
  small-body renderer, rigid hierarchy renderer, found-object attachment
  hook, non-periodic animation) that draw simulation state in the Three.js
  layer.
- `WI-02c.md` — the ecology illusion (section 20): schooling plus
  cross-species reactions (flee, scavenge, orient, hide, zone quiet before
  large events) driven by the world-signal bus, verified headlessly.
