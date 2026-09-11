# Reviewer probe: map view model leaks

Question: does `buildMapViewModel` leak creature or spawn data into the
map view model?

- `probe.ts` — builds the simulation, calls `buildMapViewModel`, checks the
  resulting JSON for creature-related field names.
