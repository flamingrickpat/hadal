# Performance Observation Probe

Browser performance measurement probe for WI-07d (60 FPS verification).

- `probe.mjs` — Playwright script that boots the game at 1920×1080, teleports to each depth band, and measures FPS using the WI-07a telemetry collector
- `output/` — probe results (JSON and screenshots)

To run: `node probe.mjs` from this directory.
