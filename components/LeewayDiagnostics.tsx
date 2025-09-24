/* LEEWAY HEADER — DO NOT REMOVE
TAG: LEEWAY_VISUAL_DIAGNOSTICS
COLOR_ONION_HEX: NEON=#39FF14 FLUO=#1E90FF PASTEL=#22C55E
ICON_FAMILY: lucide
ICON_GLYPH: activity
ICON_SIG: LWD001
5WH: WHAT=Visual diagnostics overlay system; WHY=Real-time error monitoring and development insights; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\LeewayDiagnostics.tsx; WHEN=2025-09-22; HOW=React overlay with severity color coding
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect } from 'react';

//#region Types
export interface DiagnosticEntry {
  ts: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'FATAL';
  module: string;
  operation: string;
  message: string;
  data?: any;
  file_path?: string;
  line?: number;
  region_tag?: string;
  diag_code?: string;
  runId: string;
}

interface LeewayDiagnosticsProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
//#endregion

//#region Styles
const severityStyles = {
  INFO: '#1E90FF',
  SUCCESS: '#22C55E', 
  WARN: '#F59E0B',
  ERROR: '#EF4444',
  FATAL: '#7F1D1D'
};

const diagnosticStyles = `
  .leeway-diagnostics-overlay {
    position: fixed;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    border: 2px solid #39FF14;
    backdrop-filter: blur(5px);
  }

  .leeway-diagnostics-top-left { top: 1rem; left: 1rem; }
  .leeway-diagnostics-top-right { top: 1rem; right: 1rem; }
  .leeway-diagnostics-bottom-left { bottom: 1rem; left: 1rem; }
  .leeway-diagnostics-bottom-right { bottom: 1rem; right: 1rem; }

  .leeway-error-throb {
    animation: errorThrob 1s infinite alternate;
    border: 2px solid #EF4444 !important;
  }

  @keyframes errorThrob {
    0% { box-shadow: 0 0 5px #EF4444; }
    100% { box-shadow: 0 0 20px #EF4444, 0 0 30px #EF4444; }
  }

  .leeway-diagnostic-entry {
    margin-bottom: 0.5rem;
    padding: 0.25rem;
    border-left: 3px solid;
    padding-left: 0.5rem;
  }

  .leeway-diagnostic-entry.INFO { border-left-color: #1E90FF; }
  .leeway-diagnostic-entry.SUCCESS { border-left-color: #22C55E; }
  .leeway-diagnostic-entry.WARN { border-left-color: #F59E0B; }
  .leeway-diagnostic-entry.ERROR { border-left-color: #EF4444; }
  .leeway-diagnostic-entry.FATAL { border-left-color: #7F1D1D; }

  .leeway-diagnostic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #39FF14;
  }

  .leeway-diagnostic-title {
    color: #39FF14;
  }

  .leeway-diagnostic-toggle {
    background: #39FF14;
    color: black;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    margin-right: 0.25rem;
  }

  .leeway-diagnostic-toggle:last-child {
    margin-right: 0;
  }

  .leeway-diagnostic-level.INFO { color: #1E90FF; }
  .leeway-diagnostic-level.SUCCESS { color: #22C55E; }
  .leeway-diagnostic-level.WARN { color: #F59E0B; }
  .leeway-diagnostic-level.ERROR { color: #EF4444; }
  .leeway-diagnostic-level.FATAL { color: #7F1D1D; }

  .leeway-diagnostic-message {
    font-size: 10px;
    color: #ccc;
  }

  .leeway-diagnostic-file {
    font-size: 10px;
    color: #888;
  }

  .leeway-diagnostic-operational {
    color: #22C55E;
  }
`;
//#endregion

//#region Public API
export const LeewayDiagnostics: React.FC<LeewayDiagnosticsProps> = ({ 
  enabled = true, 
  position = 'bottom-right' 
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Listen for diagnostic events
    const handleDiagnostic = (event: CustomEvent<DiagnosticEntry>) => {
      setDiagnostics(prev => [event.detail, ...prev.slice(0, 19)]); // Keep last 20
    };

    window.addEventListener('leeway-diagnostic' as any, handleDiagnostic);
    return () => window.removeEventListener('leeway-diagnostic' as any, handleDiagnostic);
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <>
      <style>{diagnosticStyles}</style>
      <div className={`leeway-diagnostics-overlay leeway-diagnostics-${position}`}>
        <div className="leeway-diagnostic-header">
          <span className="leeway-diagnostic-title">🔍 LEEWAY DIAGNOSTICS</span>
          <div>
            <button 
              className="leeway-diagnostic-toggle"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
            <button 
              className="leeway-diagnostic-toggle"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <div>
            {diagnostics.length === 0 ? (
              <div className="leeway-diagnostic-operational">All systems operational ✓</div>
            ) : (
              diagnostics.map((entry, index) => (
                <div 
                  key={index} 
                  className={`leeway-diagnostic-entry ${entry.level}`}
                >
                  <div className={`leeway-diagnostic-level ${entry.level}`}>
                    [{entry.level}] {entry.module}.{entry.operation}
                  </div>
                  <div className="leeway-diagnostic-message">
                    {entry.message}
                  </div>
                  {entry.file_path && (
                    <div className="leeway-diagnostic-file">
                      {entry.file_path}:{entry.line}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Global diagnostic logger
export const logDiagnostic = (entry: Omit<DiagnosticEntry, 'ts' | 'runId'>) => {
  const diagnostic: DiagnosticEntry = {
    ...entry,
    ts: new Date().toISOString(),
    runId: crypto.randomUUID?.() || Math.random().toString(36)
  };

  // Emit event for overlay
  window.dispatchEvent(new CustomEvent('leeway-diagnostic', { detail: diagnostic }));
  
  // Console logging with color
  const color = severityStyles[entry.level];
  console.log(
    `%c[LEEWAY ${entry.level}] ${entry.module}.${entry.operation}: ${entry.message}`,
    `color: ${color}; font-weight: bold;`,
    entry.data || ''
  );
};
//#endregion

export default LeewayDiagnostics;