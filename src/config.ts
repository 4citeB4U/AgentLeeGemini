/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_CONFIG
COLOR_ONION_HEX: NEON=#6B7280 FLUO=#4B5563 PASTEL=#E5E7EB
ICON_FAMILY: lucide
ICON_GLYPH: settings-2
ICON_SIG: AL003002
5WH: WHAT=Application configuration and settings; WHY=Centralized configuration management; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\config.ts; WHEN=2025-09-22; HOW=TypeScript configuration constants and interfaces
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

// D:\AGENT_LEE_X\src\config.ts

/** 
 * If true, the application will strictly use local engines and block all outbound 
 * non-origin fetch requests. Useful for offline work or maximum privacy.
 */
export const USE_LOCAL_ONLY = false;

/** 
 * If true and USE_LOCAL_ONLY is false, the Gemini engine will be available as a 
 * fallback if local engines fail.
 */
export const USE_GEMINI = true;

/** 
 * The base path for the self-hosted Stable Diffusion model files. 
 * This has been updated to a public Hugging Face URL to resolve "File not found" errors
 * that occur when the model files are not hosted locally.
 */
export const MODEL_BASE = 'https://huggingface.co/Xenova/sd-turbo/resolve/main';

/**
 * The base path for the self-hosted upscaler model files.
 */
export const UPSCALE_BASE = '/models/realesrgan';

/**
 * Default image dimensions [width, height].
 */
export const DEFAULT_SIZE = [512, 512] as const;

/**
 * Default number of inference steps for the diffusion model.
 * SD-Turbo works well with very few steps.
 */
export const DEFAULT_STEPS = 4;

/**
 * Simple diagnostic logging function for development and debugging
 */
export const logDiagnostic = (data: {
  level: string;
  module: string;
  operation: string;
  message: string;
  data?: any;
  file_path?: string;
  line?: number;
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${data.level}] ${data.module}:${data.operation} - ${data.message}`, data.data);
  }
};