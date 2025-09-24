/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_RESEARCHER
COLOR_ONION_HEX: NEON=#84CC16 FLUO=#65A30D PASTEL=#D9F99D
ICON_FAMILY: lucide
ICON_GLYPH: book-open
ICON_SIG: AL002014
5WH: WHAT=Research and information gathering component; WHY=Web search and data collection capabilities; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\Researcher.tsx; WHEN=2025-09-22; HOW=React component with search APIs
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect, useRef } from 'react';
import type { GroundingChunk } from '../types';
import ResultContainer from './ResultContainer';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { markdownToHtml } from '../utils/markdown';
import GeneratedImage from './GeneratedImage';
import { openSmart } from '../src/nativeShell';

interface ResearcherProps {
  result: { text: string; sources: GroundingChunk[] };
  loading: boolean;
  error: string;
  /** Desktop in-app webview opener (kept for your existing behavior). */
  setBrowserUrl: (url: string) => void;
}

const Researcher: React.FC<ResearcherProps> = ({ result, loading, error, setBrowserUrl }) => {
  const renderContentWithImages = (text: string) => {
    const imagePlaceholderRegex = /\[IMAGE:\s*([^\]]+)\]/g;
    const parts = text.split(imagePlaceholderRegex);

    return (
      <div>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            const prompt = part.trim();
            return <GeneratedImage key={`img-${index}`} prompt={prompt} />;
          }
          return (
            <div
              key={`txt-${index}`}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(part) }}
            />
          );
        })}
      </div>
    );
  };

  const handleOpen = (url?: string) => {
    if (!url) return;
    // Mobile: opens system browser IN-APP (SFSafariViewController / Custom Tabs)
    // Desktop: uses your existing in-app webview
    openSmart(url, setBrowserUrl);
  };

  return (
    <div className="h-full flex flex-col">
      {loading && <LoadingSpinner message="Searching the web and composing response..." />}
      {error && <ErrorMessage message={error} />}

      {(result.text || result.sources.length > 0) ? (
        <div className="flex-grow overflow-y-auto">
          {result.text && (
            <div className="prose max-w-none prose-p:text-gray-700 prose-strong:text-black prose-a:text-indigo-600 bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
              {renderContentWithImages(result.text)}
            </div>
          )}

          {result.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Sources</h3>
              <ul className="list-none p-0 space-y-2">
                {result.sources.map((s, i) =>
                  s.web?.uri ? (
                    <li key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpen(s.web!.uri)}
                        className="flex-grow text-left p-3 bg-gray-50 border border-gray-200 rounded-md text-indigo-600 transition-colors hover:bg-gray-100 hover:underline overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {s.web.title || s.web.uri}
                      </button>
                      <button
                        onClick={() => handleOpen(s.web!.uri)}
                        title="Open in in-app system browser"
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300"
                        aria-label="Open source"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5" />
                          <path d="M10 14l10 -10" />
                          <path d="M15 4l5 0l0 5" />
                        </svg>
                      </button>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}
        </div>
      ) : (!loading && !error && (
        <div className="text-center text-gray-500 h-full flex items-center justify-center">
          <p>Select a research mode, enter a prompt, and click send.</p>
        </div>
      ))}
    </div>
  );
};

export default Researcher;
