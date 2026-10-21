import { defineConfig, devices } from '@playwright/test';

const PORT = 5180;
// Read through globalThis: the root tsconfig has no Node types, and a global
// `declare const process` would clash with @types/node.
const CI = !!(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.CI;

export default defineConfig({
  testDir: './e2e',
  retries: CI ? 2 : 0,
  reporter: CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
  },
});
