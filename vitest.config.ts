import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // enable in-source testing
    includeSource: ['static/ts/**/*.ts'],
    // use jsdom for DOM APIs since some of the code interacts with the DOM
    environment: 'jsdom',
    // vitest globals are enabled by default
    mockReset: true,
  },
});
