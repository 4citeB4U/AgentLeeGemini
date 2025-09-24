/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_CHARACTER_CONTEXT
COLOR_ONION_HEX: NEON=#A855F7 FLUO=#9333EA PASTEL=#E9D5FF
ICON_FAMILY: lucide
ICON_GLYPH: users
ICON_SIG: AL006001
5WH: WHAT=Character state management context; WHY=Centralized character data and persona management; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\contexts\CharacterContext.tsx; WHEN=2025-09-22; HOW=React context with character state management
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Character } from '../types';

interface CharacterContextType {
    characters: Character[];
    addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => Character;
    updateCharacter: (updatedCharacter: Character) => void;
    deleteCharacter: (id: number) => void;
}

export const CharacterContext = createContext<CharacterContextType>({
    characters: [],
    addCharacter: () => ({} as Character),
    updateCharacter: () => {},
    deleteCharacter: () => {},
});

export const CharacterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [characters, setCharacters] = useState<Character[]>(() => {
        try {
            const localData = localStorage.getItem('agent-lee-characters');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Could not parse characters from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('agent-lee-characters', JSON.stringify(characters));
        } catch (error) {
            console.error("Could not save characters to localStorage", error);
        }
    }, [characters]);

    const addCharacter = (characterData: Omit<Character, 'id' | 'createdAt'>): Character => {
        const newCharacter: Character = {
            ...characterData,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };
        setCharacters(prev => [newCharacter, ...prev]);
        return newCharacter;
    };

    const updateCharacter = (updatedCharacter: Character) => {
        setCharacters(prev => prev.map(c => (c.id === updatedCharacter.id ? updatedCharacter : c)));
    };

    const deleteCharacter = (id: number) => {
        if (window.confirm('Are you sure you want to delete this character profile? This action is permanent.')) {
            setCharacters(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <CharacterContext.Provider value={{ characters, addCharacter, updateCharacter, deleteCharacter }}>
            {children}
        </CharacterContext.Provider>
    );
};
