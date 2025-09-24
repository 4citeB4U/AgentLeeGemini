/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_TYPES
COLOR_ONION_HEX: NEON=#64748B FLUO=#475569 PASTEL=#CBD5E1
ICON_FAMILY: lucide
ICON_GLYPH: code
ICON_SIG: AL001003
5WH: WHAT=TypeScript type definitions and interfaces; WHY=Type safety and developer experience; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\types.ts; WHEN=2025-09-22; HOW=TypeScript interface and type declarations
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

export type Feature = "research" | "text" | "image" | "analyze" | "document" | "call" | "email" | "notepad" | "settings" | "character" | "audio";

export type Role = "user" | "model";

// ChatMsg is used by the CommunicationControl component
export type ChatMsg = {
  role: Role;
  parts: string;
};

// ADDED: Centralized type for transmission log entries
export type TransmissionLogEntry = {
    id: number;
    speaker: 'USER' | 'AGENT' | 'SYSTEM';
    text: string;
    timestamp: string; // ISO 8601 string format
};


export type ResearchMode = "general" | "academic" | "wikipedia";

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

// --- New Note Types for Centralized Notepad ---

export type NoteContent =
  | { type: 'text'; text: string; audioData?: { base64: string; mimeType: string; }; isEncrypted?: boolean; iv?: string; salt?: string; }
  | { type: 'image'; imageUrl: string; prompt: string; }
  | { type: 'research'; text: string; sources: GroundingChunk[]; }
  | { type: 'analysis'; text: string; fileName?: string; audioData?: { base64: string; mimeType: string; }; isEncrypted?: boolean; iv?: string; salt?: string; }
  | { type: 'call'; text: string; callDetails: string; audioData?: { base64: string; mimeType: string; }; isEncrypted?: boolean; iv?: string; salt?: string; }
  | { type: 'audio'; transcription: string; fileName: string; audioData: { base64: string; mimeType: string; duration?: number; }; isEncrypted?: boolean; iv?: string; salt?: string; }
  // NEW: Added a 'memory' type to store conversations for the RAG system.
  | { type: 'memory'; userPrompt: string; agentResponse: string; };

export interface Note {
  id: number;
  title: string;
  date: string;
  tag: string;
  content: NoteContent;
}

// --- Types for Multi-Engine Image Generation ---

export type GenReq = { prompt: string; seed?: number; size?: [number, number]; steps?: number };

export type GenOut =
  | { type:'rgba'; data: Uint8ClampedArray; width:number; height:number }
  | { type:'blob'; data: Blob }
  | { type:'base64'; data: string }; // data is base64 string without data:image/... prefix

export type AgentState = "idle" | "listening" | "thinking" | "speaking";

// NEW: Type for contacts stored in localStorage
export interface Contact {
    id: number;
    name: string;
    phone: string;
}

// NEW: Character type for the Character Studio
export interface Character {
  id: number;
  name: string;
  appearance: string; // For image generation consistency
  personality: string; // For text generation consistency
  avatarUrl?: string; // Base64 data URL
  createdAt: string; // ISO 8601 string
}

// NEW: Type for the call queue
export interface CallQueueItem {
  number: string;
  purpose: string;
}