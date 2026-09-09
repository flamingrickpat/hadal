// Reviewer scratch config (WI-03c1a review): run only this probe file.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'agents/tasks/hadalv2.execute_leaf.__attempt_0014/scratch/reviewer/wi03c1a-probe/probe.test.ts',
    ],
  },
});
