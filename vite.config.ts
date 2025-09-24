/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_VITE_CONFIG
COLOR_ONION_HEX: NEON=#646CFF FLUO=#5B6FFF PASTEL=#C4D7FF
ICON_FAMILY: lucide
ICON_GLYPH: zap
ICON_SIG: AL008001
5WH: WHAT=Vite build tool configuration; WHY=Development server and build process setup; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\vite.config.ts; WHEN=2025-09-22; HOW=Vite configuration with plugins and build settings
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: process.env.NODE_ENV === 'production' ? '/AgentLeeGemini/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // DO NOT expose API keys to client bundle
        // Only expose safe build-time flags
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['@google/genai']
            }
          }
        }
      }
    };
});
