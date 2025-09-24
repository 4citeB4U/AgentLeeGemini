/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_RESULT_CONTAINER
COLOR_ONION_HEX: NEON=#10B981 FLUO=#059669 PASTEL=#A7F3D0
ICON_FAMILY: lucide
ICON_GLYPH: clipboard-list
ICON_SIG: AL002020
5WH: WHAT=Result display and output container; WHY=Structured presentation of agent outputs; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\ResultContainer.tsx; WHEN=2025-09-22; HOW=React component with formatted output display
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_RESULT_CONTAINER
COLOR_ONION_HEX: NEON=#8B5CF6 FLUO=#7C3AED PASTEL=#DDD6FE
ICON_FAMILY: lucide
ICON_GLYPH: container
ICON_SIG: AL002020
5WH: WHAT=Result display container component; WHY=Consistent result presentation and formatting; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\ResultContainer.tsx; WHEN=2025-09-22; HOW=React component with result styling and layout
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect } from 'react';
import { markdownToHtml } from '../utils/markdown';

interface ResultContainerProps {
  markdownContent: string;
}

const ResultContainer: React.FC<ResultContainerProps> = ({ markdownContent }) => {
  const [copyStatus, setCopyStatus] = useState('Copy');

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    }, () => {
      setCopyStatus('Failed!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-result.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gemini AI Result',
          text: markdownContent,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] flex flex-col">
      <div className="flex-shrink-0 p-2 border-b border-gray-200 flex items-center justify-end gap-2 bg-gray-100/50 rounded-t-lg">
        <button onClick={handleCopy} className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">{copyStatus}</button>
        <button onClick={handleDownload} className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">Download</button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <button onClick={handleShare} className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">Share</button>}
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
        <div
          className="prose max-w-none prose-p:text-gray-700 prose-strong:text-black prose-a:text-indigo-600"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(markdownContent) }}
        />
      </div>
    </div>
  );
};

export default ResultContainer;
