/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_OUTPUT
COLOR_ONION_HEX: NEON=#22C55E FLUO=#16A34A PASTEL=#BBF7D0
ICON_FAMILY: lucide
ICON_GLYPH: message-square
ICON_SIG: AL002003
5WH: WHAT=Agent output display and conversation log; WHY=Show agent responses and conversation history; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\AgentOutput.tsx; WHEN=2025-09-22; HOW=React component with scrollable message list
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useEffect, useRef, useState } from 'react';
import type { TransmissionLogEntry } from '../types';

interface AgentOutputProps {
    log: TransmissionLogEntry[];
    onAction: (action: 'save' | 'memory', entry: TransmissionLogEntry) => void;
    onDelete: (id: number) => void;
}

const AgentOutput: React.FC<AgentOutputProps> = ({ log, onAction, onDelete }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [collapsedEntries, setCollapsedEntries] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (contentRef.current) {
            // Only auto-scroll if the user is already near the bottom
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                 contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
        }
    }, [log]);
    
    const getSpeakerStyle = (speaker: 'USER' | 'AGENT' | 'SYSTEM') => {
        switch (speaker) {
            case 'USER':
                return { color: '#63b3ed', prefix: 'YOU: ' }; // Light blue for user
            case 'AGENT':
                return { color: '#00ff41', prefix: 'LEE: ' }; // Green for agent
            case 'SYSTEM':
                return { color: '#d4af37', prefix: 'SYS: ' }; // Gold for system
            default:
                return { color: '#fff', prefix: '' };
        }
    };
    
    const getColorType = (color: string): string => {
        switch (color) {
            case '#63b3ed':
                return 'user';
            case '#00ff41':
                return 'agent';
            case '#d4af37':
                return 'system';
            case '#ef4444':
                return 'error';
            default:
                return 'default';
        }
    };
    
    const toggleCollapse = (id: number) => {
        setCollapsedEntries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const styles = `
        .agent-output-container {
            background-color: #111;
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            flex-grow: 0.8;
            min-height: 0;
            font-family: 'Roboto Mono', monospace;
        }
        .agent-output-content-wrapper {
            flex-grow: 1;
            background-color: rgba(0,0,0,0.4);
            border-radius: 0.5rem;
            overflow: hidden;
            padding: 0.75rem;
            border: 1px solid rgba(212, 175, 55, 0.2);
            min-height: 0;
        }
        .agent-output-content {
            height: 100%;
            overflow-y: auto;
            font-size: 0.875rem;
            line-height: 1.6;
        }
        .log-entry {
            margin-bottom: 0.5rem;
            position: relative;
        }
        .log-entry:hover .log-entry-actions {
            opacity: 1;
        }
        .log-entry-actions {
            position: absolute;
            top: 2px;
            right: 0px;
            display: flex;
            gap: 0.5rem;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            z-index: 10;
        }
        .log-action-btn {
            background: rgba(212, 175, 55, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #d4af37;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .log-action-btn:hover {
            background: rgba(212, 175, 55, 0.4);
            color: #fff;
        }
        .log-entry-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            opacity: 0.7;
            font-size: 0.75rem;
            cursor: pointer;
        }
        .log-entry-header .speaker-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .log-entry-header .chevron {
            transition: transform 0.2s ease-in-out;
        }
        .log-entry.collapsed .chevron {
            transform: rotate(-90deg);
        }
        .log-entry-text {
            white-space: pre-wrap;
            word-wrap: break-word;
            padding-left: 0.5rem;
            border-left: 2px solid rgba(255,255,255,0.1);
            margin-top: 0.25rem;
            max-height: 1000px;
            overflow: hidden;
            transition: max-height 0.3s ease-out, opacity 0.3s ease-in-out;
            opacity: 1;
        }
        .log-entry.collapsed .log-entry-text {
            max-height: 0;
            opacity: 0;
            margin-top: 0;
            padding-left: 0.5rem;
            border-left: 2px solid transparent;
        }
        
        /* Custom scrollbar for terminal */
        .agent-output-content::-webkit-scrollbar {
            width: 6px;
        }
        .agent-output-content::-webkit-scrollbar-track {
            background: transparent;
        }
        .agent-output-content::-webkit-scrollbar-thumb {
            background-color: var(--text-secondary);
            border-radius: 3px;
        }
        .small-icon {
            font-size: 12px;
        }
        /* Dynamic color classes */
        .log-entry-header-default-cursor {
            cursor: default;
        }
        /* Color variants using data attributes */
        .speaker-info[data-color="user"],
        .log-entry-text[data-color="user"] {
            color: #63b3ed;
        }
        .speaker-info[data-color="agent"],
        .log-entry-text[data-color="agent"] {
            color: #00ff41;
        }
        .speaker-info[data-color="system"],
        .log-entry-text[data-color="system"] {
            color: #d4af37;
        }
        .speaker-info[data-color="error"],
        .log-entry-text[data-color="error"] {
            color: #ef4444;
        }
        /* Default fallback */
        .speaker-info[data-color="default"],
        .log-entry-text[data-color="default"],
        .speaker-info,
        .log-entry-text {
            color: #fff;
        }
        @media (max-width: 1024px) {
            .agent-output-container {
                min-height: 200px;
                flex-shrink: 0;
            }
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="agent-output-container">
                <div className="agent-output-content-wrapper">
                    <div ref={contentRef} className="agent-output-content">
                        {log.map(entry => {
                            const { color, prefix } = getSpeakerStyle(entry.speaker);
                            const isCollapsible = entry.speaker === 'AGENT';
                            const isCollapsed = isCollapsible && collapsedEntries.has(entry.id);
                            const showActions = entry.speaker === 'USER' || entry.speaker === 'AGENT';

                            return (
                                <div key={entry.id} className={`log-entry ${isCollapsed ? 'collapsed' : ''}`}>
                                    {showActions && (
                                        <div className="log-entry-actions">
                                            {entry.speaker === 'AGENT' && (
                                                <button
                                                    className="log-action-btn"
                                                    title="Commit to Memory"
                                                    onClick={(e) => { e.stopPropagation(); onAction('memory', entry); }}
                                                >
                                                    <i className="fas fa-brain small-icon"></i>
                                                </button>
                                            )}
                                            <button
                                                className="log-action-btn"
                                                title="Save to Notepad"
                                                onClick={(e) => { e.stopPropagation(); onAction('save', entry); }}
                                            >
                                                <i className="fas fa-save small-icon"></i>
                                            </button>
                                            <button
                                                className="log-action-btn"
                                                title="Delete Message"
                                                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                            >
                                                <i className="fas fa-trash-alt small-icon"></i>
                                            </button>
                                        </div>
                                    )}

                                    {isCollapsible ? (
                                        <div className="log-entry-header" onClick={() => toggleCollapse(entry.id)}>
                                            <div className="speaker-info" data-color={getColorType(color)}>
                                                <svg className="chevron w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                <span>{prefix.slice(0,-2)}</span>
                                            </div>
                                            <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ) : (
                                         <div className="log-entry-header log-entry-header-default-cursor">
                                            <div className="speaker-info" data-color={getColorType(color)}>
                                                <span>{prefix.slice(0,-2)}</span>
                                            </div>
                                            <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                    <div className="log-entry-text" data-color={getColorType(color)}>
                                        <span>{entry.text}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgentOutput;