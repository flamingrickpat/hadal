import { defineConfig } from 'vitest/config';

// Reviewer scratch probe runner: runs the independent WI-07 probe spec through
// the project's vitest (Vite resolver handles the source's extensionless TS
// imports). Kept out of the product test dir (src/**/*.test.ts).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['agents/tasks/hadal/scratch/work-item-reviewer/WI-07/probe.test.ts'],
  },
});
