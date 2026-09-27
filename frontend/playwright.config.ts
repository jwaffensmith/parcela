import { defineConfig, devices } from '@playwright/test'

const UI_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:8000'

// Virtualenv scripts land in Scripts\ on Windows and bin/ everywhere else.
const UVICORN = process.platform === 'win32' ? 'venv\\Scripts\\uvicorn' : 'venv/bin/uvicorn'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: UI_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${UVICORN} main:app --port 8000`,
      cwd: '../backend',
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      url: UI_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
