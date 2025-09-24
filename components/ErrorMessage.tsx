/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ERROR_MESSAGE
COLOR_ONION_HEX: NEON=#EF4444 FLUO=#DC2626 PASTEL=#FECACA
ICON_FAMILY: lucide
ICON_GLYPH: alert-circle
ICON_SIG: AL002006
5WH: WHAT=Error message display component; WHY=User-friendly error reporting and recovery guidance; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\ErrorMessage.tsx; WHEN=2025-09-22; HOW=React component with error styling
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="text-center font-medium text-red-800 py-4 my-4 bg-red-100 border border-red-300 rounded-md">
      {message}
    </div>
  );
};

export default ErrorMessage;
