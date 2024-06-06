import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    css: true,
  },
  define: {
    __debug__: process.env.APP_TEST_DEBUG === '1',
    __mode__: '"test"',
    __dev__: true,
  },
});
