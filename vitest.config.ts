/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_VITEST_CONFIG
COLOR_ONION_HEX: NEON=#6E9F18 FLUO=#52A043 PASTEL=#C8E6C9
ICON_FAMILY: lucide
ICON_GLYPH: test-tube
ICON_SIG: AL008006
5WH: WHAT=Vitest testing framework configuration; WHY=Unit testing and test runner setup; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\vitest.config.ts; WHEN=2025-09-22; HOW=Vitest configuration with test environment settings
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import { defineConfig } from 'vitest/config';
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    css: true,
    clearMocks: true,
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      all: true,
      include: [
        "src/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "services/**/*.{ts,tsx}",
        "utils/**/*.{ts,tsx}",
        "contexts/**/*.{ts,tsx}"
      ],
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.{ts,js}",
        "**/coverage/**",
        "**/test/**"
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/components',
      '@services': '/services',
      '@utils': '/utils',
      '@contexts': '/contexts'
    }
  }
});