// Reviewer scratch vitest config (WI-02a review). The project config only
// includes src/**/*.test.ts; this lets this directory's probes run against
// the real product modules without touching product code or the project
// config. Run from the repo root:
//   npx vitest run -c <this file>
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['agents/tasks/hadalv2.execute_leaf.__attempt_0003/scratch/work-item-reviewer/probes/**/*.test.ts'],
    environment: 'node',
  },
});
