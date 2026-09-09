import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['agents/tasks/hadalv2.execute_leaf.__attempt_0015/scratch/reviewer/**/*.test.ts'],
  },
});
