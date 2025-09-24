/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_PERSISTENT_ACTIONS
COLOR_ONION_HEX: NEON=#39FF14 FLUO=#0DFF94 PASTEL=#C7FFD8
ICON_FAMILY: lucide
ICON_GLYPH: layers
ICON_SIG: AL002001
5WH: WHAT=Persistent action toolbar component; WHY=Quick access to common operations across all features; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\PersistentActions.tsx; WHEN=2025-09-22; HOW=React component with horizontal scrolling action buttons
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useContext, useState, useRef, useEffect } from 'react';
import { NotepadContext } from '../contexts/NotepadContext';
import type { Feature, NoteContent, GroundingChunk, Note } from '../types';

interface PersistentActionsProps {
    activeFeature: Feature;
    resultData: {
        text: string;
        imageUrl: string;
        sources: GroundingChunk[];
        prompt: string;
        fileName?: string;
    };
    onAiAnalyze: () => void;
}

const icons = {
    newNote: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 20l7 -7" /><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" /></svg>,
    save: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>,
    sync: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>,
    ai: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 16.5l-3 -3l3 -3" /><path d="M14 16.5l3 -3l-3 -3" /><path d="M9 12h6" /><path d="M6 8.25c.5 1 1.5 1.5 3 1.5c1.5 0 2.5 -.5 3 -1.5" /><path d="M12 3a9 9 0 0 0 0 18a9 9 0 0 0 6.362 -15.365" /></svg>,
    eye: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.2 4.6 -6.1 7 -9 7s-6.8 -2.4 -9 -7c2.2 -4.6 6.1 -7 9 -7s6.8 2.4 9 7" /></svg>,
    export: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3" /></svg>,
    print: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg>,
    share: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M8.7 10.7l6.6 -3.4" /><path d="M8.7 13.3l6.6 3.4" /></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>,
    chevronRight: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>,
};

const PersistentActions: React.FC<PersistentActionsProps> = ({ activeFeature, resultData, onAiAnalyze }) => {
    const { addNote, notes, activeNoteId } = useContext(NotepadContext);
    const [syncStatus, setSyncStatus] = useState('Sync');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const activeNote = notes.find(n => n.id === activeNoteId);

    const handleSave = () => {
        let noteContent: NoteContent | null = null;
        let title = `Note from ${activeFeature}`;

        switch (activeFeature) {
            case 'text':
                if (!resultData.text) return;
                title = resultData.prompt.substring(0, 40) || 'Text Result';
                noteContent = { type: 'text', text: resultData.text };
                break;
            case 'image':
                if (!resultData.imageUrl) return;
                title = resultData.prompt.substring(0, 40) || 'Image Result';
                noteContent = { type: 'image', imageUrl: resultData.imageUrl, prompt: resultData.prompt };
                break;
            case 'research':
                if (!resultData.text) return;
                title = resultData.prompt.substring(0, 40) || 'Research Result';
                noteContent = { type: 'research', text: resultData.text, sources: resultData.sources };
                break;
            case 'analyze':
            case 'document':
                 if (!resultData.text) return;
                 title = `Analysis of ${resultData.fileName || 'file'}`;
                 noteContent = { type: 'analysis', text: resultData.text, fileName: resultData.fileName };
                 break;
        }

        if (noteContent) {
            addNote(title, noteContent);
        }
    };

    const handleSync = () => {
        setSyncStatus('...');
        setTimeout(() => {
            setSyncStatus('OK');
            setTimeout(() => setSyncStatus('Sync'), 2000);
        }, 1500);
    };

    const handleExport = () => {
        if (!activeNote) return;
        let content = '';
        // FIX: Added explicit checks for note content type to prevent accessing properties on the wrong type.
        if (activeNote.content.type === 'text' || activeNote.content.type === 'research' || activeNote.content.type === 'analysis' || activeNote.content.type === 'call') {
            content = activeNote.content.text;
        } else if (activeNote.content.type === 'image') {
            content = `Image Prompt: ${activeNote.content.prompt}\nImage URL: ${activeNote.content.imageUrl}`;
        } else if (activeNote.content.type === 'memory') {
            content = `--- MEMORY ---\n\nUSER PROMPT:\n${activeNote.content.userPrompt}\n\nAGENT RESPONSE:\n${activeNote.content.agentResponse}`;
        }
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const handlePrint = () => {
        if (!activeNote) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>${activeNote.title}</title></head>
                    <body><h1>${activeNote.title}</h1><pre>${activeNote.content.type === 'text' ? activeNote.content.text : 'Cannot print this note type.'}</pre></body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };
    
    const handleShare = async () => {
        if (!activeNote || !navigator.share) return;
        try {
            await navigator.share({
                title: activeNote.title,
                text: activeNote.content.type === 'text' ? activeNote.content.text : `Link to note: ${activeNote.title}`,
            });
        } catch (error) {
            console.error("Share failed:", error);
        }
    }


    const hasSaveableContent = resultData.text || resultData.imageUrl;
    
    const isContentAvailable = !!(resultData.text || resultData.imageUrl);
    const isNotepadActiveWithNote = activeFeature === 'notepad' && !!activeNote;
    const isAnalysisDisabled = !isNotepadActiveWithNote && !isContentAvailable;

    const checkScrollability = () => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 5); // A small buffer to avoid floating point issues
            setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        checkScrollability();

        const resizeObserver = new ResizeObserver(checkScrollability);
        resizeObserver.observe(el);
        Array.from(el.children).forEach(child => resizeObserver.observe(child));

        el.addEventListener('scroll', checkScrollability, { passive: true });

        const timeoutId = setTimeout(checkScrollability, 100);

        return () => {
            resizeObserver.disconnect();
            el.removeEventListener('scroll', checkScrollability);
            clearTimeout(timeoutId);
        };
    }, [notes]); // Re-checking on `notes` is a good fallback

    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };


    const styles = `
        .persistent-actions-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            overflow: hidden; /* Hide the scroll buttons if they peek out */
            font-family: 'Segoe UI', sans-serif;
        }
        .persistent-actions-container {
            display: flex;
            gap: 0.5rem; /* 8px */
            align-items: center;
            overflow-x: auto;
            padding: 0.5rem 0;
            -ms-overflow-style: none;
            scrollbar-width: none;
            scroll-behavior: smooth;
        }
        .persistent-actions-container::-webkit-scrollbar {
            display: none;
        }
        .scroll-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            background-color: rgba(13, 59, 51, 0.9);
            color: white;
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: opacity 0.2s, background-color 0.2s, transform 0.2s;
            opacity: 0;
            pointer-events: none;
        }
        .scroll-btn:hover {
            background-color: #1a5c4d;
            transform: translateY(-50%) scale(1.1);
        }
        .scroll-btn.visible {
            opacity: 1;
            pointer-events: auto;
        }
        .scroll-btn-left {
            left: -10px;
        }
        .scroll-btn-right {
            right: -10px;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="persistent-actions-wrapper">
                 <button
                    className={`scroll-btn scroll-btn-left ${canScrollLeft ? 'visible' : ''}`}
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll left"
                >
                    {icons.chevronLeft}
                </button>
                <div ref={scrollContainerRef} className="persistent-actions-container">
                     <ActionButton onClick={() => addNote('New Note', { type: 'text', text: '' })} icon={icons.newNote} label="New Note" />
                     <ActionButton onClick={handleSave} icon={icons.save} label="Save Result" disabled={!hasSaveableContent || activeFeature === 'notepad'} />
                     <div className="w-px h-10 bg-gray-600 mx-1 flex-shrink-0"></div>
                     <ActionButton onClick={onAiAnalyze} icon={icons.ai} label="AI Analysis" disabled={isAnalysisDisabled} />
                     <div className="w-px h-10 bg-gray-600 mx-1 flex-shrink-0"></div>
                     <ActionButton onClick={handleSync} icon={icons.sync} label={syncStatus} disabled={syncStatus !== 'Sync'} />
                     <ActionButton onClick={handleExport} icon={icons.export} label="Export Note" disabled={!activeNote} />
                     <ActionButton onClick={handlePrint} icon={icons.print} label="Print Note" disabled={!activeNote || activeNote.content.type !== 'text'} />
                     <ActionButton onClick={handleShare} icon={icons.share} label="Share Note" disabled={!activeNote || !navigator.share} />
                </div>
                 <button
                    className={`scroll-btn scroll-btn-right ${canScrollRight ? 'visible' : ''}`}
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll right"
                >
                    {icons.chevronRight}
                </button>
            </div>
        </>
    );
};

const ActionButton: React.FC<{onClick: () => void, icon: React.ReactElement, label: string, disabled?: boolean}> = ({onClick, icon, label, disabled}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            className="flex flex-col items-center justify-center w-20 h-16 bg-[#0d3b33] text-white rounded-md transition-all hover:bg-[#1a5c4d] disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60 border border-transparent hover:border-[#d4af37] p-1 text-center flex-shrink-0"
        >
            {icon}
            <span className="text-xs mt-1 leading-tight">{label}</span>
        </button>
    )
}

export default PersistentActions;
