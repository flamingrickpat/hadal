# scratch/reviewer/tier4-browser (WI-03d2 review)

Independent re-run of the tier's browser spot-checks, to confirm the
implementer's live evidence is real and reproducible. `probe.mjs` is a
verbatim copy of the implementer's probe at the same tree depth (so its
`repoRoot` resolution holds); it was run with
`HADAL_BROWSER_PORT=54323` so it starts its own dev server on a clean
port, drives headless Chromium (SwiftShader, 1920×1080, `?debug=1`), and
stops only the server it started (by PID).

Result of this review session: 15/15 checks passed (exit 0); numbers match
the committed implementer run to within animation noise.

- `probe.mjs` — copy of `scratch/implementer/tier4-spot-check/probe.mjs`.
- `out/result.json` — the re-run's check results.
- `out/t19-large.png`, `out/t23-colossal.png`, `out/tier4-scene.png` —
  the re-run's screenshots.
