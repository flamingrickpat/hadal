import { defineConfig } from 'vitest/config';

// Reviewer-probe config: the product's own vitest config ignores
// agents/, so this standalone config lets the reviewer probes run
// against the real product source without touching the product rig.
export default defineConfig({
  test: {
    include: ['C:/Temp/hadal-v2/agents/tasks/hadalv2.execute_leaf.__attempt_0008/scratch/reviewer/*.test.ts'],
    testTimeout: 30000,
  },
});
