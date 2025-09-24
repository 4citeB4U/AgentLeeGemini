
/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_MARKDOWN
COLOR_ONION_HEX: NEON=#06B6D4 FLUO=#0891B2 PASTEL=#A5F3FC
ICON_FAMILY: lucide
ICON_GLYPH: edit-3
ICON_SIG: AL005002
5WH: WHAT=Markdown parsing and rendering utilities; WHY=Rich text processing and content formatting; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\utils\markdown.ts; WHEN=2025-09-22; HOW=TypeScript utility functions for markdown processing
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

export function markdownToHtml(markdown: string): string {
  const w = typeof window !== "undefined" ? (window as any) : undefined;
  const marked = w?.marked?.parse ?? w?.marked ?? null;
  try {
    return marked ? marked(markdown) : markdown.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  } catch {
    return markdown.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
