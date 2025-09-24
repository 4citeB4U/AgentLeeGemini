/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_TEXT_GENERATOR
COLOR_ONION_HEX: NEON=#14B8A6 FLUO=#0D9488 PASTEL=#99F6E4
ICON_FAMILY: lucide
ICON_GLYPH: type
ICON_SIG: AL002015
5WH: WHAT=Text generation and content creation component; WHY=AI-powered writing and content assistance; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\TextGenerator.tsx; WHEN=2025-09-22; HOW=React component with AI text models
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React from 'react';
import ResultContainer from './ResultContainer';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface TextGeneratorProps {
  result: string;
  loading: boolean;
  error: string;
  systemInstruction: string;
  setSystemInstruction: (value: string) => void;
}

const TextGenerator: React.FC<TextGeneratorProps> = ({ result, loading, error, systemInstruction, setSystemInstruction }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <label htmlFor="system-instruction" className="block text-sm font-medium text-gray-700 mb-1">System Instruction (Optional)</label>
        <input
          id="system-instruction"
          type="text"
          value={systemInstruction}
          onChange={(e) => setSystemInstruction(e.target.value)}
          placeholder="e.g., Act as a world-class chef"
          className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="flex-grow">
        {loading && <LoadingSpinner message="Thinking..." />}
        {error && <ErrorMessage message={error} />}
        {result && <ResultContainer markdownContent={result} />}
        {!loading && !error && !result && (
            <div className="text-center text-gray-500 h-full flex items-center justify-center">
                <p>Enter a prompt and an optional instruction, then click send.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TextGenerator;
