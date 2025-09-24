/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ENGINE_TYPES
COLOR_ONION_HEX: NEON=#1F2937 FLUO=#111827 PASTEL=#F9FAFB
ICON_FAMILY: lucide
ICON_GLYPH: cpu
ICON_SIG: AL007001
5WH: WHAT=AI engine type definitions and interfaces; WHY=Type safety for AI model interactions; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\engines\engine.types.ts; WHEN=2025-09-22; HOW=TypeScript interface definitions for AI engines
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

// D:\AGENT_LEE_X\src\engines\engine.types.ts

export type GenReq = { 
  prompt: string; 
  seed?: number; 
  size?: [number, number]; 
  steps?: number 
};

export type GenOut =
  | { type: 'rgba'; data: Uint8ClampedArray; width: number; height: number }
  | { type: 'blob'; data: Blob }
  | { type: 'base64'; data: string }; // Note: data is raw base64, not a data URL

export interface ImageEngine {
  /** A unique identifier for the engine */
  name: string;

  /** Checks if the engine is available and ready to use (e.g., browser support, model loaded) */
  available(): Promise<boolean>;

  /** Generates an image based on the provided request */
  generate(req: GenReq): Promise<GenOut>;
}
