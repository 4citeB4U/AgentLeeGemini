/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_PLAYWRIGHT_CONFIG
COLOR_ONION_HEX: NEON=#2EAD33 FLUO=#248A2C PASTEL=#C8E6C9
ICON_FAMILY: lucide
ICON_GLYPH: theater
ICON_SIG: AL008007
5WH: WHAT=Playwright end-to-end testing configuration; WHY=Browser automation and E2E test setup; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\playwright.config.ts; WHEN=2025-09-22; HOW=Playwright configuration with browser settings
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],
  webServer: {
    command: 'npm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  outputDir: './test-results/',
});