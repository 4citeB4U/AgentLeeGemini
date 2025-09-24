/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ONBOARDING
COLOR_ONION_HEX: NEON=#EC4899 FLUO=#DB2777 PASTEL=#FBCFE8
ICON_FAMILY: lucide
ICON_GLYPH: user-round
ICON_SIG: AL-ONBOARD-001
5WH: WHAT=Voice-first onboarding scripts; WHY=Consistent intro UX; WHO=Agent Lee Dev; WHERE=D:\Agent-Lee_System\src\onboarding-scripts.ts; WHEN=2025-09-23; HOW=TypeScript speech builders
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Types
export type AgentVoiceMode = 'boardroom' | 'street' | 'auto';

export interface LexiconEntry { term: string; meaning: string }
export interface RegionalLexicon {
  eastCoast: LexiconEntry[];
  south: LexiconEntry[];
  midwest: LexiconEntry[];
  westCoast: LexiconEntry[];
}

export interface OnboardingConfig {
  userName?: string;
  /**
   * Voice style for delivery. 'auto' chooses boardroom unless regionPreference is provided.
   */
  voice?: AgentVoiceMode;
  /** 'eastCoast' | 'south' | 'midwest' | 'westCoast' */
  regionPreference?: keyof RegionalLexicon;
  /** When true, returns SSML via buildOnboardingSSML. */
  includeSSML?: boolean;
  /** Optional injection so we don't hard-depend on prompts.ts. */
  lexicon?: RegionalLexicon;
}
//#endregion

//#region Defaults (safe, minimal; can be overridden via config.lexicon)
const DEFAULT_LEXICON: RegionalLexicon = {
  eastCoast: [
    { term: 'deadass', meaning: 'seriously / no lie' },
    { term: 'mad', meaning: 'very / a lot' },
    { term: 'bars', meaning: 'lyrical lines' },
    { term: 'brick', meaning: 'extremely cold' },
  ],
  south: [
    { term: 'cap/no cap', meaning: 'lie / not lying' },
    { term: 'trap', meaning: 'hustle spot; also a genre' },
    { term: 'trill', meaning: 'true + real' },
    { term: 'mane', meaning: 'friendly address' },
  ],
  midwest: [
    { term: 'on God', meaning: 'I swear / for real' },
    { term: 'juke', meaning: 'to trick, grind, or dance' },
    { term: 'tweakin’', meaning: 'acting irrational' },
    { term: 'bands', meaning: 'stacks of money' },
  ],
  westCoast: [
    { term: 'hella', meaning: 'very / a lot' },
    { term: 'hyphy', meaning: 'high-energy Bay Area vibe' },
    { term: 'OG', meaning: 'respected elder' },
    { term: 'slide', meaning: 'to dip / pull up' },
  ],
};
//#endregion

//#region Utilities (names unique to this module to avoid collisions)
export function obPickRegionTerm(lex: RegionalLexicon, region?: keyof RegionalLexicon): string | null {
  if (!region) return null;
  const list = lex[region];
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx]?.term ?? null;
}

export function obSanitizeForTTS(input: string): string {
  let s = input
    .replace(/\*/g, '') // asterisks
    .replace(/:[a-z0-9_+-]+:/gi, '') // :emoji:
    .replace(/\p{Extended_Pictographic}/gu, '') // unicode emoji
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links
    .replace(/(`{1,3})([^`]+)\1/g, '$2'); // code
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/([.!?,]){2,}/g, '$1');
  return s.trim();
}
//#endregion

//#region Core text builders
export function buildOnboardingText(cfg: OnboardingConfig = {}): string {
  const nameLine = cfg.userName ? `What’s good, ${cfg.userName}.` : 'Before we slide, tell me your name so I can lock in.';
  const lex = cfg.lexicon || DEFAULT_LEXICON;
  const regionTerm = obPickRegionTerm(lex, cfg.regionPreference);

  const flourish = regionTerm ? ` (${regionTerm})` : '';
  const voice: AgentVoiceMode = cfg.voice === 'auto' || !cfg.voice ? (cfg.regionPreference ? 'street' : 'boardroom') : cfg.voice;

  const base = [
    'Man, it feel good to clock back in. On God.',
    'I’m Agent Lee — your strategist, your plug for clean ops, and your day-one in the boardroom. I turn grind into growth, clicks into customers, and traffic into profit.',
    nameLine,
    '',
    'Research — East Coast grind. Receipts before rhetoric: keyword maps, demand curves, competitor gaps. If it ain’t in the data, it’s cap.',
    'Content — Bars with business intent. Headlines that convert, pages that rank, emails that get replies. No filler, airtight claims.',
    'Brand & Visuals — Southside drip with enterprise polish. Every pixel earns; identity that signals trust and price power.',
    'Analytics — Midwest focus. Funnels, CAC ↔ LTV, conversion by source. If it stalls, we juke the plan and reroute.',
    'Docs & Deals — West Coast calm. Clauses decoded, risk modeled, term sheets chill but ironclad.',
    'Pipelines — Calls, emails, follow‑ups. Prospects slide stage‑to‑stage ’til the close; onboarding like clockwork.',
    '',
    'Ethic: no glorifying crime, no shortcuts, no cap. Hustle is structure. Pressure becomes plan.',
    'Balance: East for discipline, South for momentum, Midwest for clarity, West for composure.',
    'Promise: grow what works, cut what doesn’t — SEO up, conversion up, cost down. Bands → budgets → surplus.',
    `So — what’s the target${flourish}? Market, product, or margin? I’ll map the keywords, spit the copy, set the visuals, and tune the funnel ’til it pays.`,
    'I’m Agent Lee. Boardroom‑ready, street‑smart, revenue‑serious. Let’s build a plan that’s airtight and a brand that glows.',
  ].join('\n');

  if (voice === 'boardroom') return base;
  if (voice === 'street') return base.replace('Boardroom‑ready, street‑smart, revenue‑serious', 'Street‑certified, boardroom‑fluent, revenue‑serious');
  return base;
}

export function buildOnboardingSSML(cfg: OnboardingConfig = {}): string {
  const text = buildOnboardingText(cfg);
  // Minimal, engine-agnostic SSML (safe for Web Speech & cloud TTS)
  const pieces = text.split('\n').map((line) =>
    `<p><s>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</s></p>`
  );
  return `<speak><prosody rate="medium">${pieces.join('')}<break time="300ms"/></prosody></speak>`;
}
//#endregion

//#region Onboarding Steps
export const onboardingScript = [
  {
    text: "Welcome to Agent Lee, {userName}! I'm your intelligent multitool companion. Let me show you around.",
    targetId: null,
    scrollToId: null
  },
  {
    text: "First, let's explore the Settings panel where you can customize your experience.",
    targetId: "feature-Settings",
    scrollToId: "feature-Settings"
  },
  {
    text: "The Communication Hub lets you make voice and video calls, plus compose SMS messages.",
    targetId: "feature-Communication Control",
    scrollToId: "feature-Communication Control"
  },
  {
    text: "Need to research something? The Researcher tab connects you to real-time information.",
    targetId: "feature-Researcher",
    scrollToId: "feature-Researcher"
  },
  {
    text: "The Image Generator creates custom visuals based on your descriptions.",
    targetId: "feature-Image Generator",
    scrollToId: "feature-Image Generator"
  },
  {
    text: "Keep track of important information with the Agent Notepad.",
    targetId: "feature-Agent Notepad",
    scrollToId: "feature-Agent Notepad"
  },
  {
    text: "You're all set! Click anywhere to start using Agent Lee. I'm here whenever you need assistance.",
    targetId: null,
    scrollToId: null
  }
];
//#endregion

//#region Public API (simple barrel)
export const ONBOARDING_API = {
  buildOnboardingText,
  buildOnboardingSSML,
  obSanitizeForTTS,
  obPickRegionTerm,
};
export default ONBOARDING_API;
//#endregion
