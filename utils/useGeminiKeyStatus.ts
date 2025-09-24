/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_USE_GEMINI_KEY_STATUS
COLOR_ONION_HEX: NEON=#059669 FLUO=#10B981 PASTEL=#A7F3D0
ICON_FAMILY: lucide
ICON_GLYPH: key-round
ICON_SIG: AL001011
5WH: WHAT=React hook for Gemini key status; WHY=Surface presence & environment warnings; WHO=Agent Lee Development Team; WHERE=utils/useGeminiKeyStatus.ts; WHEN=2025-09-24; HOW=Hook that inspects import.meta.env and process.env and returns structured status
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import { useMemo } from 'react';

export interface GeminiKeyStatus {
  present: boolean;
  keySource: 'vite' | 'process' | 'absent';
  isProduction: boolean;
  warning?: string;
  maskedKey?: string;
}

function mask(k?: string) {
  if (!k) return undefined;
  return k.length <= 8 ? '*'.repeat(k.length) : `${k.slice(0,4)}***${k.slice(-2)}`;
}

export function useGeminiKeyStatus(): GeminiKeyStatus {
  return useMemo(() => {
    const viteEnv: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    const raw = viteEnv.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    const keySource: GeminiKeyStatus['keySource'] = raw
      ? (viteEnv.VITE_GEMINI_API_KEY ? 'vite' : (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY ? 'process' : 'absent'))
      : 'absent';
    const isProduction = (process.env.NODE_ENV || viteEnv.MODE) === 'production';
    let warning: string | undefined;
    if (!raw) {
      warning = isProduction
        ? 'Gemini key absent: production runtime should avoid direct client usage. Use a proxy service.'
        : 'Gemini key not found. Add VITE_GEMINI_API_KEY to .env.local and restart dev server.';
    } else if (isProduction) {
      warning = 'Key detected in production bundle; ensure this build will not be publicly exposed or move calls server-side.';
    }
    return { present: !!raw, keySource, isProduction, warning, maskedKey: mask(raw) };
  }, []);
}

export default useGeminiKeyStatus;
