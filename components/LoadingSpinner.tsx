/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_LOADING_SPINNER
COLOR_ONION_HEX: NEON=#3B82F6 FLUO=#2563EB PASTEL=#DBEAFE
ICON_FAMILY: lucide
ICON_GLYPH: loader
ICON_SIG: AL002005
5WH: WHAT=Loading spinner component; WHY=Visual feedback during async operations; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\LoadingSpinner.tsx; WHEN=2025-09-22; HOW=React component with CSS animation
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="text-center italic text-gray-600 py-4 my-4 flex justify-center items-center gap-2">
      <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {message}
    </div>
  );
};

export default LoadingSpinner;
