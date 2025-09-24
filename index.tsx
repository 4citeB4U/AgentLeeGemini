
/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_INDEX
COLOR_ONION_HEX: NEON=#F97316 FLUO=#EA580C PASTEL=#FED7AA
ICON_FAMILY: lucide
ICON_GLYPH: play
ICON_SIG: AL001002
5WH: WHAT=React application entry point; WHY=Bootstrap and initialize the Agent Lee application; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\index.tsx; WHEN=2025-09-22; HOW=React DOM render with root component mounting
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// FIX: Temporarily disabled Service Worker registration.
// The preview environment causes a same-origin policy error during registration,
// even with checks in place. Disabling this resolves the error for this specific environment.
/*
if ('serviceWorker' in navigator && !location.hostname.endsWith('usercontent.goog')) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
*/


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);