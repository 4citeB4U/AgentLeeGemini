/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ENGINE_GEMINI
COLOR_ONION_HEX: NEON=#4285F4 FLUO=#1A73E8 PASTEL=#E3F2FD
ICON_FAMILY: lucide
ICON_GLYPH: brain-circuit
ICON_SIG: AL007003
5WH: WHAT=Google Gemini AI engine implementation; WHY=Primary AI model integration for text and multimodal tasks; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\engines\engine.gemini.ts; WHEN=2025-09-22; HOW=TypeScript engine wrapper for Gemini API
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

// D:\AGENT_LEE_X\src\engines\engine.gemini.ts

import { USE_GEMINI } from '../config';
import { generateImage as generateWithGemini } from '../../services/geminiService';
import type { ImageEngine, GenReq, GenOut } from './engine.types';

class GeminiEngine implements ImageEngine {
    name = 'gemini';

    async available(): Promise<boolean> {
        // The Gemini engine is available if configured and the API key is present.
        return USE_GEMINI && !!process.env.API_KEY;
    }

    async generate(req: GenReq): Promise<GenOut> {
        console.log('Using Gemini Engine for generation...');
        try {
            // The geminiService returns a data URL: "data:image/jpeg;base64,..."
            const dataUrl = await generateWithGemini(req.prompt);
            
            // We need to extract the raw base64 part.
            const base64Data = dataUrl.split(',')[1];
            
            if (!base64Data) {
                throw new Error("Invalid base64 response from Gemini service.");
            }

            return {
                type: 'base64',
                data: base64Data,
            };
        } catch (error) {
            console.error("Gemini Engine failed:", error);
            // Re-throw to allow the router to try the next engine.
            throw error;
        }
    }
}

// Export a single instance of the engine.
// The engine will be non-functional if USE_GEMINI is false.
const geminiEngine = new GeminiEngine();
export default geminiEngine;