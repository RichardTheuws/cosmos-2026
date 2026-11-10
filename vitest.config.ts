import { defineConfig } from 'vitest/config';

// Wave 22 D5 — pure-logic substrate resolver/schema tests. Node env (no jsdom):
// every target is a pure function over plain manifest objects. Renderer /
// CosmoScene / parallax / post-FX are covered at the integration layer by the
// Playwright visual-UAT harness, NOT here (see .claude/brainstorm/wave22/04).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
  },
});
