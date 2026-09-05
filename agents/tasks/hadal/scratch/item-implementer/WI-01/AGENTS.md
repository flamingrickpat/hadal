# WI-01 Boot Probe (item-implementer scratch)

Answers: does the dev-server page really boot a WebGL frame at
1920×1080 in a real browser engine, with a clean console?

- `probe.mjs` — starts `npm run dev --port 5199 --strictPort`, opens the
  page in headless Chromium (playwright-core driving the local
  ms-playwright binary at 1920×1080, deviceScaleFactor 1), asserts a
  1920×1080 WebGL2 canvas renders a non-blank frame, captures console
  and page exceptions, saves `output/boot-1920x1080.png`.
- `package.json` — playwright-core only.
- `run.ps1` — runs the probe; exits with the probe's exit code.
- `output/` — probe artifacts: screenshot, `console.json`,
  `result.json`, `server.log`.

The screenshot and result.json are the evidence attached to
`../../implementation/WI-01-implementation.md`.
