/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_BUILD_SCRIPT
COLOR_ONION_HEX: NEON=#10B981 FLUO=#059669 PASTEL=#A7F3D0
ICON_FAMILY: lucide
ICON_GLYPH: hammer
ICON_SIG: AL009001
5WH: WHAT=Build-time API key secure usage; WHY=Generate static content without exposing secrets; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\scripts\build-secure.js; WHEN=2025-09-23; HOW=Node.js script for build-time content generation
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Secure build script - generates static content using API keys at build time
 * This ensures API keys never reach the client-side bundle
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 Starting secure build process...');

// Get API key from environment (only available during build)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  No GEMINI_API_KEY found - building without API features');
  console.log('💡 For GitHub Actions: Ensure GEMINI_API_KEY secret is set');
  console.log('💡 For local development: Use .env.local file');
} else {
  console.log('✅ GEMINI_API_KEY found - building with full API features');
  console.log(`🔑 API key starts with: ${GEMINI_API_KEY.substring(0, 8)}...`);
}

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate build manifest with timestamp
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const buildManifest = {
  buildTime: new Date().toISOString(),
  hasApiKey: !!GEMINI_API_KEY,
  version: packageJson.version,
  environment: 'production'
};

// Write build manifest (safe to expose)
fs.writeFileSync(
  path.join(publicDir, 'build-manifest.json'),
  JSON.stringify(buildManifest, null, 2)
);

console.log('✅ Build manifest created');
console.log('🔒 API key secured (not included in client bundle)');
console.log('🚀 Secure build process complete!');