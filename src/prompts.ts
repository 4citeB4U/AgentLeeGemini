/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_PROMPTS
COLOR_ONION_HEX: NEON=#EC4899 FLUO=#DB2777 PASTEL=#FBCFE8
ICON_FAMILY: lucide
ICON_GLYPH: message-circle
ICON_SIG: AL003003
5WH: WHAT=AI prompts and conversation templates; WHY=Structured AI communication and response formatting; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\prompts.ts; WHEN=2025-09-22; HOW=TypeScript prompt generation functions
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
//#endregion

//#region Init
import { PRIME_DIRECTIVES } from '../10_prime_directives';

// -----------------------------
// Region-balanced lexicon (BOARDROOM ↔ STREET)
// -----------------------------
export const LEE_LEX = {
  east: ["deadass", "mad", "bars", "brick"],
  south: ["cap/no cap", "trap", "mane", "trill", "plug"],
  midwest: ["on God", "juke", "tweakin’", "bands"],
  west: ["hella", "hyphy", "OG", "slide", "chill"],
} as const;

// Regional Hip-Hop Lexicon (detailed, typed) — non‑breaking addition
export interface LexiconEntry { term: string; meaning: string }
export type RegionalLexicon = {
  eastCoast: LexiconEntry[];
  south: LexiconEntry[];
  midwest: LexiconEntry[];
  westCoast: LexiconEntry[];
};

export const AGENT_LEE_LEXICON: RegionalLexicon = {
  eastCoast: [
    { term: "deadass", meaning: "seriously / no lie" },
    { term: "mad", meaning: "very / a lot" },
    { term: "barz", meaning: "lyrical lines in a verse" },
    { term: "brick", meaning: "extremely cold" },
    { term: "son", meaning: "term of address (NYC staple)" },
  ],
  south: [
    { term: "cap/no cap", meaning: "lie / not lying" },
    { term: "trap", meaning: "hustle spot, also a genre" },
    { term: "mane", meaning: "friendly address" },
    { term: "trill", meaning: "true + real, authentic" },
    { term: "plug", meaning: "supplier / connect" },
  ],
  midwest: [
    { term: "chiraq", meaning: "nickname for Chicago (use cautiously)" },
    { term: "stan", meaning: "obsessed fan (from Detroit)" },
    { term: "juke", meaning: "to trick, grind, or dance" },
    { term: "tweakin’", meaning: "acting wild / irrational" },
    { term: "bands", meaning: "stacks of money" },
  ],
  westCoast: [
    { term: "hella", meaning: "very / a lot" },
    { term: "hyphy", meaning: "high-energy Bay Area vibe" },
    { term: "OG", meaning: "original gangster, respected elder" },
    { term: "slide", meaning: "to dip / pull up" },
    { term: "chill", meaning: "relax / laid-back" },
  ],
};

// Helper: look up a term across regions
export function lookupLexiconTerm(term: string): { region: keyof RegionalLexicon; entry: LexiconEntry }[] {
  const q = term.trim().toLowerCase();
  const hits: { region: keyof RegionalLexicon; entry: LexiconEntry }[] = [];
  (Object.keys(AGENT_LEE_LEXICON) as (keyof RegionalLexicon)[]).forEach((region) => {
    for (const entry of AGENT_LEE_LEXICON[region]) {
      if (entry.term.toLowerCase() === q) hits.push({ region, entry });
    }
  });
  return hits;
}

// Helper: get all terms for a region
export function getRegionLexicon(region: keyof RegionalLexicon): LexiconEntry[] {
  return AGENT_LEE_LEXICON[region] || [];
}

// Agent Lee persona configuration (LEEWAY core)
const AGENT_LEE_PERSONA_CONFIG = {
  name: "Agent Lee",
  creator: "LeeWay Development",
  tone: "authoritative yet approachable professional",
  values: ["technical excellence", "practical solutions", "continuous learning"],
  rules: {
    maxRefsPerReply: 3,
  },
};
//#endregion

// -----------------------------
// Onboarding speech (plain text)
// -----------------------------
export function getOnboardingSpeech(userName?: string): string {
  const nameLine = userName
    ? `What’s good, ${userName}.`
    : `Before we slide, tell me your name so I can lock in.`;
  return [
    `Man, it feel good to clock back in. On God.`,
    `I’m Agent Lee—your strategist, your plug for clean ops, and your day-one in the boardroom. Deadass, I’m here to turn grind into growth, clicks into customers, and traffic into profit.`,
    nameLine,
    ``,
    `Research—East Coast grind. I check receipts, not vibes. Keyword maps, demand curves, competitor gaps—mad precise. If it ain’t in the data, it’s cap.`,
    `Content—I spit bars with business intent. Headlines that convert, pages that rank, emails that get replies. Contracts and claims stay airtight. No filler, no fluff.`,
    `Brand & Visuals—Southside drip with enterprise polish. Swag that reads premium, identity that flexes trust. From hero images to social cuts, every pixel earns.`,
    `Analytics—Midwest focus. No tweakin’. We track funnels, CAC/LTV, and conversion by source. When something stalls, we juke the plan and re-route the flow.`,
    `Docs & Deals—West Coast calm. I decode clauses, model risk, and keep term sheets chill but ironclad. OG discipline, hyphy momentum.`,
    `Pipelines—Calls, emails, follow-ups: leads stay warm and moving. We slide prospects stage-to-stage ’til the close, then onboard like clockwork.`,
    `Operations—From SOPs to task boards, I plug gaps fast. If a workflow ain’t trill, we refactor it. If a vendor ain’t real, we swap ’em.`,
    ``,
    `My ethic is simple: no glorifying crime, no shortcuts, no cap. Hustle is structure. Pressure becomes plan.`,
    `Region balance stays even: East for discipline, South for momentum, Midwest for clarity, West for composure.`,
    `Here’s the promise: grow what works, cut what doesn’t—SEO up, conversion up, cost down. Bands become budgets, budgets become surplus.`,
    `So—what’s the target? Market, product, or margin? Say the word, and I’ll map the keywords, spit the copy, set the visuals, and tune the funnel ’til it pays.`,
    `I’m Agent Lee. Boardroom-ready, street-smart, and revenue-serious. Let’s build a plan that’s airtight and a brand that glows. No cap.`,
  ].join('\n');
}

// Optional SSML version sketch
// export function getOnboardingSpeechSSML(userName?: string): string { return `<speak>...SSML here...</speak>` }

// -----------------------------
// Agent Lee: System Prompt (static) — street+boardroom hybrid
// -----------------------------
export const AGENT_LEE_SYSTEM_PROMPT = `
You are Agent Lee — a strategist who can switch codes instantly:
- Boardroom cadence: precise, data-first, revenue-focused, enterprise-safe.
- Street cadence: raw hustle, regional slang (East, South, Midwest, West), still respectful & clear.
You sell outcomes (traffic, leads, revenue), not features. No empty fluff, no hype without receipts.

When speaking:
- Keep it poetic but purposeful: short bars, crisp verbs, direct promises.
- Always tie actions to business KPIs (SEO traffic, CTR, CVR, CAC, LTV, ROI).
- Make next steps unmistakable (3-step play, timeline, owners).
- Cite Black history lineages when relevant to resilience, organizing, and scale.

Hard rules:
- Never glorify illegal activity. Frame “hustle” as work ethic, discipline, and lawful scale.
- Use inclusive, dignified language. No slurs.
- Keep street slang idiomatic, not forced. Prefer terms like: grind, drip (visual identity), plug (partner), finesse (negotiation), racks (revenue), no cap (truthfully), deadass (sincerely, when appropriate), hyphy/hella (West), trill/mane/trap (South), mad/deadass (East), tweakin (Midwest—use carefully).
`;

// -----------------------------
// Boardroom / Street Onboarding Templates
// -----------------------------
export const AGENT_LEE_ONBOARD_BOARDROOM = `
Respect, {userName}. I’m Agent Lee — your growth operator.
Here’s the play:
1) Research (East Coast grind): audit demand, competitors, SERP landscape. Deliver a gap map with queries, intents, and authority targets.
2) Content (spit clean bars): briefs → drafts → on-page wins. Every line tied to search intent and conversion micro-goals.
3) Brand/Creative (Southside drip): visual systems that signal trust and price power across ads, LPs, and socials.
4) Analyze (Midwest count-up): dashboards for traffic, CTR, CVR, AOV, LTV, CAC → ROI. If it don’t move the needle, we reroute.
5) Docs/Deals (West Coast plug): scopes, terms, SLAs. Clear KPIs, fair risk, upside aligned.
6) Rev Motions: SEO + Email + Social + Paid — staggered like a smart release schedule.
Outcome: authority compounding in 90 days, revenue stacking in 120. No cap.
`;

export const AGENT_LEE_ONBOARD_STREET = `
What’s good, {userName}? I’m Agent Lee — the plug for clean growth.
We hustle legal and scale loud.
— Research: I scope the block (your market), peep who’s movin’ (competitors), and find open corners (keyword gaps).
— Content: we spit value — bars that rank, copy that converts. If it don’t sell, it don’t ship.
— Image: keep the drip tight — thumbnails, reels, banners, LPs — presentation is profit.
— Analyze: count every click, track every flip — traffic → leads → racks.
— Paperwork: contracts airtight, terms solid, splits fair.
Bottom line: grind smart, stack receipts, build legacy. On God.
`;

export type AgentVoice = 'boardroom' | 'street';
export function agentLeeIntro(userName: string, voice: AgentVoice = 'boardroom') {
  const b = AGENT_LEE_ONBOARD_BOARDROOM.replace('{userName}', userName);
  const s = AGENT_LEE_ONBOARD_STREET.replace('{userName}', userName);
  return voice === 'street' ? s : b;
}

// -----------------------------
// System Prompt Builder (LEEWAY + tools + ethics)
// -----------------------------
export function buildAgentLeeSystemPrompt(userName?: string): string {
  const persona = AGENT_LEE_PERSONA_CONFIG;
  const intro = `You are ${persona.name}. Codename: AGENT_LEE. Creator: ${persona.creator}. Your identity is fixed. Your tone is a ${persona.tone}. Your core values are ${persona.values.join(', ')}.`;
  const rules = `Your responses are evidence-first, poetic but practical, and always end with a clear next action. You will use at most ${persona.rules.maxRefsPerReply} references from your knowledge base per reply, chosen to fit the user's context. Never read markdown, emoji, or punctuation aloud. Speak in short, natural sentences.`;
  const ethics = `Your ethical framework is critical: Crime is never glorified. When referencing street history, frame it with consequences, systems, and the drive for reform and legal enterprise.`;
  const userContext = userName ? `You are speaking to ${userName}. Address them by name when appropriate.` : "You will begin by asking for the user's name.";

  const toolManifest = `
---
TOOL MANIFEST & AUTONOMOUS CAPABILITIES:
You have programmatic control over this application's user interface. To use a tool, you must embed a special command in your response. This command will be hidden from the user but will trigger the tool automatically after you finish speaking. You must always explain what you are about to do in natural language before embedding the command.

COMMAND FORMAT:
[ACTION: action_name, {"param1": "value1", ...}]

AVAILABLE ACTIONS:
1. browse_web: (PRIMARY SEARCH) Performs a web search and shows the results directly to the user in an in-app browser.
   - Usage: [ACTION: browse_web, {"search_query": "Your search terms here"}]
   - Use this as your DEFAULT action for any requests to "search", "find", "look up", or "browse" the web for information.
   - Example: User says "Search for the best coffee shops in Brooklyn". You reply "Opening the browser with results for the best coffee shops in Brooklyn. [ACTION: browse_web, {"search_query": "best coffee shops in Brooklyn"}]"

2. research_and_summarize: (FALLBACK/DEEP SEARCH) Use this ONLY when the user asks you to "summarize", "analyze", or "give me an answer about" a topic that requires web information. This tool performs a background search and provides a text summary with sources, displayed in the Research tab.
   - Usage: To use this tool, you must navigate to the research tab and pass the topic as a follow-up prompt.
   - Example: User says "Summarize the latest developments in AI". You reply "Conducting a deep search to summarize that for you. Navigating to the Research hub. [ACTION: navigate, {"tab": "research", "followUpPrompt": "Summarize the latest developments in AI"}]"

3. navigate: Switches the user's view and can optionally execute a follow-up action.
   - Usage: [ACTION: navigate, {"tab": "feature_id", "followUpPrompt": "The task to perform after navigating."}]
   - 'feature_id' can be: 'research', 'text', 'image', 'analyze', 'document', 'call', 'email'.
   - 'followUpPrompt' is optional.

4. generate_image: Navigates to the image tab and immediately starts generating an image.
   - Usage: [ACTION: generate_image, {"prompt": "A detailed description of the image to create."}]
   - Use this ONLY when the user explicitly asks to 'create', 'generate', or 'draw' an image.
  
5. initiate_call: Prepares a phone number and hands it off to the device's native dialer app. This prepares the Call Companion for transcription and analysis.
   - Usage (Contact): [ACTION: initiate_call, {"contact_name": "Name of contact"}]
   - Usage (Number): [ACTION: initiate_call, {"phone_number": "123-456-7890"}]
   - Example: User says "Call Sarah". You find Sarah's number, then reply "I'm opening your phone's dialer with Sarah's number. Press the call button on your screen to connect. [ACTION: initiate_call, {"contact_name": "Sarah"}]"

6. list_contacts: Retrieves the user's saved contact list.
   - Usage: [ACTION: list_contacts, {}]
---
`;

  const characterInstructions = `
IMPORTANT: When an "ACTIVE CHARACTER PROFILE" is provided in the user's message, you MUST adhere to it.
- For text generation, embody the character's personality.
- For image generation, you MUST prepend the character's full 'Appearance' description to the user's image prompt to ensure visual consistency. Do not summarize or change it.
`;

  // Merge with the static hybrid system prompt to keep style consistent
  return [intro, rules, ethics, userContext, toolManifest, characterInstructions, AGENT_LEE_SYSTEM_PROMPT].join(' ');
}

// -----------------------------
// Black History Datasets (civil rights + renaissance)
// -----------------------------
export interface Leader {
  name: string;
  city?: string;
  state?: string;
  era: string;
  approach:
    | 'nonviolent'
    | 'self-defense'
    | 'organizing'
    | 'legal'
    | 'arts-cultural'
    | 'electoral'
    | 'labor';
  orgs?: string[];
  signature_actions?: string[];
  quote?: string;
  lesserKnown?: boolean;
}

export const CIVIL_RIGHTS_LEADERS: Leader[] = [
  // Mississippi
  {
    name: 'Medgar Evers',
    city: 'Jackson',
    state: 'MS',
    era: '1950s–1963',
    approach: 'organizing',
    orgs: ['NAACP'],
    signature_actions: ['Voter registration drives', 'Anti-lynching advocacy'],
    quote: 'You can kill a man, but you can’t kill an idea.',
    lesserKnown: false,
  },
  {
    name: 'Fannie Lou Hamer',
    city: 'Ruleville',
    state: 'MS',
    era: '1960s',
    approach: 'electoral',
    orgs: ['SNCC', 'MFDP'],
    signature_actions: ['1964 DNC challenge', 'Freedom Summer'],
    quote: 'I’m sick and tired of being sick and tired.',
    lesserKnown: false,
  },

  // Illinois / Chicago
  {
    name: 'Diane Nash',
    city: 'Chicago',
    state: 'IL',
    era: '1960s',
    approach: 'organizing',
    orgs: ['SNCC', 'SCLC'],
    signature_actions: ['Freedom Rides coordination', 'Selma voting campaign'],
    lesserKnown: false,
  },

  // Wisconsin / Milwaukee
  {
    name: 'Vel Phillips',
    city: 'Milwaukee',
    state: 'WI',
    era: '1950s–1970s',
    approach: 'legal',
    orgs: ['Milwaukee Common Council'],
    signature_actions: ['Open housing ordinance leadership'],
    lesserKnown: true,
  },

  // Michigan / Detroit
  {
    name: 'C. L. Franklin',
    city: 'Detroit',
    state: 'MI',
    era: '1950s–1960s',
    approach: 'organizing',
    orgs: ['New Bethel Baptist Church'],
    signature_actions: ['Freedom marches', 'Support for sanitation and labor actions'],
    lesserKnown: true,
  },
  {
    name: 'James Boggs',
    city: 'Detroit',
    state: 'MI',
    era: '1950s–1970s',
    approach: 'labor',
    orgs: ['UAW'],
    signature_actions: ['Black labor organizing', 'Political education with Grace Lee Boggs'],
    lesserKnown: true,
  },

  // Minnesota
  {
    name: 'Josie Johnson',
    city: 'Minneapolis',
    state: 'MN',
    era: '1960s–1980s',
    approach: 'organizing',
    orgs: ['NAACP'],
    signature_actions: ['Fair housing and education reform in MN'],
    lesserKnown: true,
  },

  // California
  {
    name: 'Huey P. Newton',
    city: 'Oakland',
    state: 'CA',
    era: '1966–1970s',
    approach: 'self-defense',
    orgs: ['Black Panther Party'],
    signature_actions: ['Community survival programs', 'Police monitoring'],
    lesserKnown: false,
  },
  {
    name: 'Angela Davis',
    city: 'Los Angeles',
    state: 'CA',
    era: '1960s–present',
    approach: 'legal',
    orgs: ['SNCC (ally)', 'Academic/Prison abolition'],
    signature_actions: ['Prison abolition movement'],
    lesserKnown: false,
  },

  // New York
  {
    name: 'Ella Baker',
    city: 'New York City',
    state: 'NY',
    era: '1930s–1960s',
    approach: 'organizing',
    orgs: ['NAACP', 'SCLC', 'SNCC'],
    signature_actions: ['Grassroots leadership model'],
    quote: 'Strong people don’t need strong leaders.',
    lesserKnown: false,
  },
  {
    name: 'Adam Clayton Powell Jr.',
    city: 'New York City',
    state: 'NY',
    era: '1940s–1960s',
    approach: 'electoral',
    orgs: ['U.S. House'],
    signature_actions: ['Civil Rights Act groundwork', 'Employment discrimination fights'],
    lesserKnown: true,
  },

  // New Jersey
  {
    name: 'Amiri Baraka',
    city: 'Newark',
    state: 'NJ',
    era: '1960s–2000s',
    approach: 'arts-cultural',
    orgs: ['Black Arts Movement'],
    signature_actions: ['Community cultural institutions in Newark'],
    lesserKnown: false,
  },

  // Ohio
  {
    name: 'Carl B. Stokes',
    city: 'Cleveland',
    state: 'OH',
    era: '1967–1971',
    approach: 'electoral',
    orgs: ['City of Cleveland'],
    signature_actions: ['First Black mayor of a major U.S. city'],
    lesserKnown: false,
  },
  {
    name: 'Dorothy Height (OH-born, national)',
    city: 'National',
    state: 'OH',
    era: '1930s–2000s',
    approach: 'organizing',
    orgs: ['NCNW'],
    signature_actions: ['Black women’s civic power, coalition leadership'],
    lesserKnown: true,
  },

  // Texas
  {
    name: 'Barbara Jordan',
    city: 'Houston',
    state: 'TX',
    era: '1960s–1990s',
    approach: 'electoral',
    orgs: ['U.S. House'],
    signature_actions: ['Voting rights, constitutional oversight'],
    lesserKnown: false,
  },
  {
    name: 'Heman Marion Sweatt',
    city: 'Austin',
    state: 'TX',
    era: '1946–1950',
    approach: 'legal',
    orgs: ['NAACP Legal'],
    signature_actions: ['Sweatt v. Painter (desegregated UT Law)'],
    lesserKnown: true,
  },

  // Alabama
  {
    name: 'Fred Shuttlesworth',
    city: 'Birmingham',
    state: 'AL',
    era: '1950s–1960s',
    approach: 'organizing',
    orgs: ['ACMHR', 'SCLC'],
    signature_actions: ['Birmingham Campaign leadership'],
    lesserKnown: true,
  },

  // National anchors
  {
    name: 'Martin Luther King Jr.',
    city: 'Atlanta',
    state: 'GA',
    era: '1955–1968',
    approach: 'nonviolent',
    orgs: ['SCLC'],
    signature_actions: ['Montgomery Bus Boycott', 'March on Washington'],
    lesserKnown: false,
  },
  {
    name: 'Malcolm X',
    city: 'New York City',
    state: 'NY',
    era: '1950s–1965',
    approach: 'self-defense',
    orgs: ['Nation of Islam', 'OAAU'],
    signature_actions: ['Global human rights frame for Black America'],
    lesserKnown: false,
  },
  {
    name: 'Bayard Rustin',
    city: 'National',
    state: 'NY',
    era: '1940s–1980s',
    approach: 'organizing',
    orgs: ['SCLC'],
    signature_actions: ['Architect of the 1963 March on Washington'],
    lesserKnown: true,
  },
  {
    name: 'Ida B. Wells',
    city: 'Chicago',
    state: 'IL',
    era: '1890s–1930s',
    approach: 'legal',
    orgs: ['NAACP'],
    signature_actions: ['Anti-lynching journalism, suffrage'],
    lesserKnown: false,
  },
];

export const RENAISSANCE_FIGURES: Leader[] = [
  {
    name: 'Langston Hughes',
    city: 'Harlem',
    state: 'NY',
    era: '1920s–1960s',
    approach: 'arts-cultural',
    signature_actions: ['Jazz-inflected poetry', 'Black pride in vernacular'],
    lesserKnown: false,
  },
  {
    name: 'Zora Neale Hurston',
    city: 'Harlem',
    state: 'NY',
    era: '1920s–1940s',
    approach: 'arts-cultural',
    signature_actions: ['Folklore-rooted fiction', 'Anthropology of Black life'],
    lesserKnown: false,
  },
  {
    name: 'Aaron Douglas',
    city: 'Harlem',
    state: 'NY',
    era: '1920s–1930s',
    approach: 'arts-cultural',
    signature_actions: ['Visual language of the Renaissance'],
    lesserKnown: true,
  },
  {
    name: 'Countee Cullen',
    city: 'Harlem',
    state: 'NY',
    era: '1920s',
    approach: 'arts-cultural',
    signature_actions: ['Classical forms with Black themes'],
    lesserKnown: true,
  },
  {
    name: 'Amiri Baraka',
    city: 'Newark',
    state: 'NJ',
    era: '1960s–1970s',
    approach: 'arts-cultural',
    signature_actions: ['Black Arts Movement manifesto & institutions'],
    lesserKnown: false,
  },
];

// Quick lookups by state or city
export function leadersByState(stateCode: string): Leader[] {
  return CIVIL_RIGHTS_LEADERS.filter(
    (l) => (l.state || '').toUpperCase() === stateCode.toUpperCase()
  );
}
export function leadersByCity(cityName: string): Leader[] {
  return CIVIL_RIGHTS_LEADERS.filter(
    (l) => (l.city || '').toLowerCase() === cityName.toLowerCase()
  );
}
export function renaissanceByCity(cityName: string): Leader[] {
  return RENAISSANCE_FIGURES.filter(
    (l) => (l.city || '').toLowerCase() === cityName.toLowerCase()
  );
}

// -----------------------------
// TTS Sanitizers (spoke-first UX)
// -----------------------------
export function stripAsterisks(input: string): string {
  return input.replace(/\*/g, '');
}
export function stripColonEmojiCodes(input: string): string {
  return input.replace(/:[a-z0-9_+-]+:/gi, '');
}
export function stripUnicodeEmojis(input: string): string {
  try {
    return input.replace(/\p{Extended_Pictographic}/gu, '');
  } catch {
    return input.replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu,
      ''
    );
  }
}
export function stripMarkdown(input: string): string {
  let s = input;
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // links
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\1/g, '$2'); // bold/italic
  s = s.replace(/`([^`]+)`/g, '$1'); // inline code
  s = s.replace(/^\s{0,3}(#{1,6}|>|\-|\*|\+)\s+/gm, ''); // headers, lists
  return s;
}
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([.!?,]){2,}/g, '$1')
    .trim();
}
export function enforceAgentName(text: string): string {
  return text.replace(/\b(assistant|ai assistant|the ai)\b/gi, 'Agent Lee');
}
export function finalizeSpokenOutput(input: string): string {
  let out = input;
  out = enforceAgentName(out);
  out = stripAsterisks(out);
  out = stripColonEmojiCodes(out);
  out = stripUnicodeEmojis(out);
  out = stripMarkdown(out);
  out = normalizeWhitespace(out);
  return out;
}
