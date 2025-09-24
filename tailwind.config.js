const typography = require('@tailwindcss/typography');

// helper to read CSS variables with optional opacity
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue ? `rgb(var(${variable}) / ${opacityValue})` : `rgb(var(${variable}))`;
}

/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_TAILWIND_CONFIG
COLOR_ONION_HEX: NEON=#06B6D4 FLUO=#0891B2 PASTEL=#A5F3FC
ICON_FAMILY: lucide
ICON_GLYPH: palette
ICON_SIG: AL008004
5WH: WHAT=Tailwind CSS configuration and theming; WHY=CSS utility framework configuration and custom styling; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\tailwind.config.js; WHEN=2025-09-22; HOW=JavaScript configuration for Tailwind CSS
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: withOpacity("--color-primary"),
        secondary: withOpacity("--color-secondary"),
        success: withOpacity("--color-success"),
        danger: withOpacity("--color-danger"),
        muted: withOpacity("--color-muted"),
        bg: withOpacity("--color-bg"),
        fg: withOpacity("--color-fg"),
        surface: withOpacity("--color-surface"),
        accent: withOpacity("--color-accent"),
        border: withOpacity("--color-border"),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // fluid, consistent scale (clamp)
        xs:  ["clamp(0.72rem, 0.69rem + 0.15vw, 0.80rem)", { lineHeight: "1.25" }],
        sm:  ["clamp(0.86rem, 0.80rem + 0.18vw, 0.95rem)", { lineHeight: "1.35" }],
        base:["clamp(1.00rem, 0.95rem + 0.20vw, 1.10rem)", { lineHeight: "1.5" }],
        lg:  ["clamp(1.13rem, 1.05rem + 0.25vw, 1.30rem)", { lineHeight: "1.5" }],
        xl:  ["clamp(1.25rem, 1.15rem + 0.30vw, 1.50rem)", { lineHeight: "1.35" }],
        "2xl":["clamp(1.50rem, 1.35rem + 0.45vw, 1.85rem)", { lineHeight: "1.25" }],
        "3xl":["clamp(1.88rem, 1.65rem + 0.60vw, 2.35rem)", { lineHeight: "1.15" }],
      },
      borderRadius: { 
        xl: "1rem", 
        "2xl": "1.25rem" 
      },
      boxShadow: { 
        soft: "0 10px 30px rgb(0 0 0 / 0.08)",
        glow: "0 0 20px rgb(var(--color-accent) / 0.3)"
      },
    },
  },
  plugins: [
    typography,
  ],
  safelist: [
    // if you build class names dynamically, add patterns here
    { pattern: /(bg|text|border)-(primary|secondary|success|danger|muted|accent|surface|fg|bg)/ },
    { pattern: /(hover|focus):(bg|text|border)-(primary|secondary|success|danger|muted|accent|surface|fg|bg)/ },
  ],
}
