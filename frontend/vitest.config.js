import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    deps: {
      inline: ['framer-motion']
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{jsx,js}'],
      exclude: ['src/main.jsx', 'src/__tests__/**']
    },
    testTimeout: 10000
  }
});
