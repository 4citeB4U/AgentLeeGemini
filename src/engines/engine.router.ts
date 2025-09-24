/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ENGINE_ROUTER
COLOR_ONION_HEX: NEON=#059669 FLUO=#047857 PASTEL=#D1FAE5
ICON_FAMILY: lucide
ICON_GLYPH: route
ICON_SIG: AL007002
5WH: WHAT=AI engine routing and selection logic; WHY=Intelligent engine selection based on task requirements; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\engines\engine.router.ts; WHEN=2025-09-22; HOW=TypeScript router with engine selection algorithms
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

// D:\AGENT_LEE_X\src\engines\engine.router.ts

import type { GenReq, GenOut } from './engine.types';
import geminiEngine from './engine.gemini';

/**
 * Generates an image using the configured primary engine (Gemini).
 * This function previously routed between a local and remote engine, but the local
 * engine was removed due to library incompatibilities causing runtime errors.
 * @param req The image generation request.
 * @returns A promise that resolves with the generated image output.
 * @throws An error if the generation engine fails.
 */
export async function generateImage(req: GenReq): Promise<GenOut> {
  try {
    if (await geminiEngine.available()) {
      console.log(`Attempting generation with engine: ${geminiEngine.name}`);
      return await geminiEngine.generate(req);
    } else {
      throw new Error('The Gemini image generation engine is not available. Please check your configuration.');
    }
  } catch (err) {
    console.error(`Engine ${geminiEngine.name} failed during generation.`, err);
    // Re-throw the error to be handled by the UI.
    throw err;
  }
}
