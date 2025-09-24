/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_NATIVE_SHELL
COLOR_ONION_HEX: NEON=#374151 FLUO=#1F2937 PASTEL=#F3F4F6
ICON_FAMILY: lucide
ICON_GLYPH: terminal
ICON_SIG: AL003007
5WH: WHAT=Native shell integration and system commands; WHY=System-level operations and native functionality; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\nativeShell.ts; WHEN=2025-09-22; HOW=TypeScript native API wrappers
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

/** 
 * Open a URL. In a true native Capacitor app, this would use the in-app browser.
 * In this web-only environment, it falls back to the provided desktop behavior 
 * or opens a new tab.
 */
export async function openSmart(url: string, desktopFallback?: (u: string) => void) {
  // Capacitor's Browser plugin is not available in this web environment.
  // We will directly use the fallback logic.
  if (desktopFallback) {
    return desktopFallback(url);
  }
  // As a final fallback, open in a new tab.
  window.open(url, '_blank', 'noopener,noreferrer');
}
