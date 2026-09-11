# WI-06d-a performance spot-check (section 34)

Question: do the organic terrain shapes fit within the section 34 performance
budget (60 FPS at 1080p on ordinary desktop browser)?

- `terrain-benchmark.ts` — benchmarks terrain generation time, counts vertex
  and shape numbers across all world chunks, and reports draw call impact.
- `probe.mjs` — runs the benchmark and writes the performance spot-check
  result.