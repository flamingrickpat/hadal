import { defineConfig } from 'vitest/config';

// Reviewer scratch probe config: run ONLY the reviewer's independent probe,
// not the product test suite. Root is the repo (so src imports resolve); the
// include is scoped to this probe directory.
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'agents/tasks/hadalv2.execute_leaf.__attempt_0011/scratch/work_item_reviewer/probe/**/*.test.ts',
    ],
  },
});
