// Minimal vitest config to run the reviewer's flag-repro test from the task
// scratch directory (the root config only includes src/**/*.test.ts).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));
// <repo>/agents/tasks/<child>/scratch/work-item-reviewer/<here>: six up is the repo root.
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');

export default defineConfig({
  root: repoRoot,
  test: {
    environment: 'node',
    include: [
      'agents/tasks/hadalv2.execute_leaf.WI-04a.__item_WI-04a.__attempt_0001/scratch/work-item-reviewer/wi04a-flag-repro/flagRepro.test.ts',
    ],
  },
});
