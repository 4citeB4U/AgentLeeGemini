/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_NOTEPAD_CONTEXT
COLOR_ONION_HEX: NEON=#22C55E FLUO=#16A34A PASTEL=#BBF7D0
ICON_FAMILY: lucide
ICON_GLYPH: notebook
ICON_SIG: AL006002
5WH: WHAT=Notepad state management context; WHY=Centralized note storage and management; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\contexts\NotepadContext.tsx; WHEN=2025-09-22; HOW=React context with note CRUD operations
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/


import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Note, NoteContent } from '../types';

interface NotepadContextType {
    notes: Note[];
    activeNoteId: number | null;
    setActiveNoteId: (id: number | null) => void;
    addNote: (title: string, content: NoteContent, tag?: string) => void;
    updateNote: (updatedNote: Note) => void;
    deleteNote: (id: number) => void;
    deleteAllNotes: () => void;
    importNotes: (importedNotes: Note[]) => void;
}

export const NotepadContext = createContext<NotepadContextType>({
    notes: [],
    activeNoteId: null,
    setActiveNoteId: () => {},
    addNote: () => {},
    updateNote: () => {},
    deleteNote: () => {},
    deleteAllNotes: () => {},
    importNotes: () => {},
});

const initialNotes: Note[] = [];


export const NotepadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>(() => {
        try {
            const localData = localStorage.getItem('agent-lee-notes');
            if (!localData) return initialNotes;

            let parsedData = JSON.parse(localData);
            
            // FIX: Add validation to prevent crashes from malformed data
            if (Array.isArray(parsedData)) {
                const validNotes = parsedData.filter(note => 
                    note &&
                    typeof note === 'object' &&
                    'id' in note &&
                    'title' in note &&
                    'content' in note &&
                    typeof note.content === 'object' &&
                    note.content !== null &&
                    'type' in note.content
                );
                return validNotes;
            }
            return initialNotes;
        } catch (error) {
            console.error("Could not parse notes from localStorage", error);
            return initialNotes;
        }
    });
    
    const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem('agent-lee-notes', JSON.stringify(notes));
        } catch (error) {
            console.error("Could not save notes to localStorage", error);
        }
    }, [notes]);

    // Effect to set an initial active note or handle deletion
    useEffect(() => {
        if (notes.length > 0 && (activeNoteId === null || !notes.find(n => n.id === activeNoteId))) {
            setActiveNoteId(notes[0].id);
        } else if (notes.length === 0) {
            setActiveNoteId(null);
        }
    }, [notes, activeNoteId]);


    const addNote = (title: string, content: NoteContent, tag: string = 'CONFIDENTIAL') => {
        const newNote: Note = {
            id: Date.now(),
            title,
            date: new Date().toLocaleString(),
            tag,
            content,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setActiveNoteId(newNote.id);
    };

    const updateNote = (updatedNote: Note) => {
        setNotes(notes.map(note => (note.id === updatedNote.id ? {...updatedNote, date: new Date().toLocaleString() } : note)));
    };

    const deleteNote = (id: number) => {
        if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            setNotes(notes.filter(note => note.id !== id));
        }
    };

    const deleteAllNotes = () => {
        if (window.confirm('Are you sure you want to delete ALL notes? This action is permanent and cannot be undone.')) {
            setNotes([]);
        }
    };

    const importNotes = (importedNotes: Note[]) => {
        // A simple import strategy: append new notes, avoiding direct ID clashes
        const existingIds = new Set(notes.map(n => n.id));
        const notesToAppend = importedNotes.filter(n => !existingIds.has(n.id));
        setNotes(prev => [...prev, ...notesToAppend]);
    };

    return (
        <NotepadContext.Provider value={{ notes, activeNoteId, setActiveNoteId, addNote, updateNote, deleteNote, deleteAllNotes, importNotes }}>
            {children}
        </NotepadContext.Provider>
    );
};