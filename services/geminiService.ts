/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_GEMINI_SERVICE
COLOR_ONION_HEX: NEON=#4285F4 FLUO=#1A73E8 PASTEL=#C8E6C9
ICON_FAMILY: lucide
ICON_GLYPH: brain
ICON_SIG: AL004001
5WH: WHAT=Google Gemini AI service integration; WHY=AI model communication and response generation; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\services\geminiService.ts; WHEN=2025-09-22; HOW=TypeScript service module with API integration
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
// FIX: Updated import path from "@google/ai" to "@google/genai"
import { GoogleGenAI, Chat, Type, Modality } from "@google/genai";
import { buildAgentLeeSystemPrompt } from '../src/prompts'; // Import the new prompt builder
import { geminiApiLimiter } from '../utils/rateLimiter'; // FIX: Import the API rate limiter
import type { Note } from '../types';

// SECURITY: For production GitHub Pages, API keys cannot be used client-side
// This service works in development only. For production, use a proxy service.
// Vite exposes env vars via import.meta.env while Node scripts use process.env.
// We unify access so local dev works with either GEMINI_API_KEY or VITE_GEMINI_API_KEY.
// NOTE: Only use API key client-side in development; never commit a real key.
const viteEnv: Record<string, string | undefined> = (typeof import.meta !== 'undefined' && (import.meta as any).env)
    ? (import.meta as any).env
    : {};

const isDevelopment = (process.env.NODE_ENV || viteEnv.MODE) === 'development';

function getRawApiKey(): string | undefined {
    return (
        // Prefer Vite-prefixed key when running in the browser dev environment
        viteEnv.VITE_GEMINI_API_KEY ||
        // Fallbacks for Node/legacy naming
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        process.env.API_KEY
    );
}

const rawApiKey = getRawApiKey();
const hasApiKey = isDevelopment && !!rawApiKey;

let ai: GoogleGenAI | null = null;

if (hasApiKey) {
    ai = new GoogleGenAI({ apiKey: rawApiKey! });
} else if (!isDevelopment) {
    console.warn('🔒 Production mode: Gemini API disabled (no client key). Use a secure proxy for API calls.');
} else {
    const possible = ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY'];
    console.warn(`⚠️ Development mode: No Gemini API key found. Set one of ${possible.join(', ')} in a .env or .env.local file.`);
}

/**
 * Check if Gemini AI is available and throw user-friendly error if not
 */
function ensureAI(): GoogleGenAI {
  if (!ai) {
    if (!isDevelopment) {
      throw new Error('🔒 Gemini AI is disabled in production for security. This feature requires a proxy service.');
    } else {
    throw new Error('⚠️ Gemini API key not found. Add VITE_GEMINI_API_KEY (preferred) or GEMINI_API_KEY to your .env.local and restart the dev server.');
    }
  }
  return ai;
}

/**
 * A wrapper function to handle common Gemini API errors, specifically for rate limiting and quota issues.
 * @param apiCall The asynchronous API function to execute.
 * @returns The result of the API call.
 * @throws A user-friendly error message if a quota error is detected.
 */
async function handleGeminiError<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
        return await apiCall();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        
        let errorMessage = (error.message || error.toString() || '').toLowerCase();
        
        // FIX: The error message from the API can be a JSON string.
        // We attempt to parse it to get a more specific message.
        if (errorMessage.startsWith('{')) {
             try {
                const parsedError = JSON.parse(error.message);
                if (parsedError.error?.message) {
                    errorMessage = parsedError.error.message.toLowerCase();
                }
             } catch (e) {
                // Ignore if it's not valid JSON.
             }
        }
        
        if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429')) {
            throw new Error("API quota exceeded. Please check your plan and billing details, or try again later.");
        }
        
        throw error;
    }
}


/**
 * NEW: Determines if a user's prompt requires visual input from the camera.
 * @param prompt The user's text prompt.
 * @returns A boolean indicating if the query is visual.
 */
export const classifyVisualRequest = async (prompt: string): Promise<boolean> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const systemInstruction = "You are a request classifier. Your task is to determine if a user's request requires using the device's camera to see something in the real world. Answer only with 'YES' or 'NO'. For example, if the user asks 'what am I wearing?' or 'can you see this?', answer 'YES'. If they ask 'what is the capital of France?', answer 'NO'.";
    
    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `User request: "${prompt}"`,
        config: {
            systemInstruction,
            temperature: 0,
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
    
    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }
    const text = response.text.trim().toUpperCase();
    console.log(`Visual Classifier for prompt "${prompt}" -> Response: "${text}" -> Decision: ${text.includes("YES")}`);
    return text.includes("YES");
}));

/**
 * NEW: Determines if a user's prompt is a direct command to the agent versus a content query.
 * This is the core of the "Agent-First" command processing logic.
 * @param prompt The user's text prompt.
 * @returns A boolean indicating if the prompt is a tool-use command.
 */
export const classifyToolUseRequest = async (prompt: string): Promise<boolean> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const systemInstruction = `You are an expert intent classifier for an AI agent. Your task is to determine if a user's prompt is a DIRECT COMMAND for the agent to perform an action (like navigating, generating content, or making a call), or if it is a CONTENT QUERY for the agent to process with its current tool.

Actions are direct commands like:
- "Go to the image tab"
- "Switch to notepad"
- "Draw a picture of a car"
- "Make a phone call to Sarah"
- "Show me the email composer"

Content queries are requests for information or generation within the current context:
- "Who was the first president?"
- "Write a poem about the moon"
- "What is in this picture?"

Analyze the user's prompt and respond with ONLY a valid JSON object with a single key "is_tool_use" which is a boolean.

Example 1:
User prompt: "go to text"
Your response:
{"is_tool_use": true}

Example 2:
User prompt: "tell me about the history of Rome"
Your response:
{"is_tool_use": false}

Example 3:
User prompt: "can you generate an image of a dragon"
Your response:
{"is_tool_use": true}`;
    
    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `User prompt: "${prompt}"`,
        config: {
            systemInstruction,
            temperature: 0,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
    
    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }
    try {
        const result = JSON.parse(response.text);
        const isToolUse = !!result.is_tool_use;
        console.log(`Tool Use Classifier for prompt "${prompt}" -> Response: ${response.text} -> Decision: ${isToolUse}`);
        return isToolUse;
    } catch (e) {
        console.error("Failed to parse tool use classification response:", response.text, e);
        return false; // Default to content query on parsing failure
    }
}));


/**
 * NEW: Generates a streaming response from a multimodal (image + text) prompt.
 * @param prompt The user's text prompt.
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns An async iterable stream of response chunks.
 */
export const generateContentStreamMultiModal = (prompt: string, base64Data: string, mimeType: string) => {
    // Note: Streaming functions are not rate-limited by this utility.
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: prompt };
    
    return ensureAI().models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
    });
};


export const generateText = async (prompt: string, systemInstruction?: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
  const response = await ensureAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return response.text;
}));

export const generateImage = async (prompt: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
  const response = await ensureAI().models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "1:1",
    },
  });

  if (!response.generatedImages || !response.generatedImages[0]) {
    throw new Error("No images were generated by Gemini");
  }
  const base64 = response.generatedImages[0]?.image?.imageBytes;
  if (!base64) {
    throw new Error("No image was generated.");
  }
  return `data:image/jpeg;base64,${base64}`;
}));

/**
 * NEW: Edits an image based on a text prompt.
 * @param prompt The user's text prompt for the edit.
 * @param base64Data The base64-encoded image data to edit.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const editImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const response = await ensureAI().models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts) {
        throw new Error("No valid response candidates received from Gemini");
    }
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const newBase64 = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${newMimeType};base64,${newBase64}`;
        }
    }

    throw new Error("The AI did not return an edited image. It might have refused the request.");
}));


export const generateMultipleImages = async (prompt: string, count: number): Promise<string[]> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const response = await ensureAI().models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt,
        config: {
            numberOfImages: count,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No images were generated.");
    }
    
    return response.generatedImages.map(img => {
        const base64 = img?.image?.imageBytes;
        if (!base64) {
             throw new Error("An error occurred while processing one of the images.");
        }
        return `data:image/jpeg;base64,${base64}`;
    });
}));


export const analyzeMedia = async (prompt: string, base64Data: string, mimeType: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: prompt
    };

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
}));

export const generateFromAudio = async (prompt: string, base64Data: string, mimeType: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const audioPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    
    const fullPrompt = `First, transcribe the user's audio. Then, based on the transcription and the optional text prompt below, provide a comprehensive answer.\n\nText Prompt: "${prompt || 'None'}"`;

    const textPart = {
        text: fullPrompt
    };

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
    });

    return response.text;
}));


export const analyzeImageFromUrl = async (prompt: string, imageUrl: string) => {
    const [header, base64Data] = imageUrl.split(',');
    if (!header || !base64Data) throw new Error("Invalid image data URL.");
    
    const mimeTypeMatch = /:(.*?);/.exec(header);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error("Could not determine MIME type from data URL.");
    
    const mimeType = mimeTypeMatch[1];
    
    return await analyzeMedia(prompt, base64Data, mimeType);
};


export const analyzeDocument = async (prompt: string, documentText: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const fullPrompt = `Please analyze the following document and answer the user's question.\n\nDOCUMENT:\n"""\n${documentText}\n"""\n\nQUESTION:\n"""\n${prompt}\n"""\n\nANALYSIS:`;
    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    return response.text;
}));


export const research = async (prompt: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
}));

export const analyzeNote = async (noteContent: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
  const prompt = `Please provide a concise analysis of the following note. Identify key entities (people, places, organizations), provide a brief summary, and list any potential action items in a markdown format.

NOTE CONTENT:
---
${noteContent}
---

ANALYSIS:`;

  const response = await ensureAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
}));

export const draftEmail = async (prompt: string, context?: { recipient?: string, subject?: string, history?: string }) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const fullPrompt = `You are an AI assistant drafting an email.
  ${context?.recipient ? `\nRECIPIENT: ${context.recipient}` : ''}
  ${context?.subject ? `\nSUBJECT: ${context.subject}` : ''}
  ${context?.history ? `\nPREVIOUS CONTEXT:\n${context.history}` : ''}
  \nINSTRUCTIONS: "${prompt}"
  \nBased on the instructions, write only the body of the email. Do not include a subject line.`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    return response.text;
}));

export const draftSms = async (prompt: string, recipient?: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const fullPrompt = `You are an AI assistant drafting a SMS text message. The message must be concise, under 160 characters, and use a casual, natural tone appropriate for texting.
  ${recipient ? `\nRECIPIENT: ${recipient}` : ''}
  \nINSTRUCTIONS: "${prompt}"
  \nDraft ONLY the body of the text message.`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });
    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }
    return response.text.trim();
}));


export const summarizeEmail = async (emailBody: string, sender: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const prompt = `Provide a concise, one-paragraph summary of the following email from ${sender}. Then, list any key questions or action items in a separate bulleted list below the summary.

EMAIL CONTENT:
---
${emailBody}
---

SUMMARY AND ACTION ITEMS:`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
}));

export const summarizeCallTranscript = async (transcript: string) => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const prompt = `You are an expert AI assistant specializing in communication analysis. Your task is to process a raw call transcript and extract meaningful insights.

Please provide the following, formatted in clean Markdown:
1.  **Concise Summary:** A brief, one-paragraph overview of the entire conversation.
2.  **Key Discussion Points:** A bulleted list of the main topics, decisions, and outcomes discussed.
3.  **Action Items:** A bulleted list of all explicit tasks, deadlines, and responsibilities mentioned. If possible, assign each action item to a speaker (e.g., "SPEAKER 1: Follow up with the finance team.").

TRANSCRIPT:
---
${transcript}
---

ANALYSIS:`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
}));

/**
 * NEW: Analyzes a user's prompt against a list of memory notes to find the most relevant context.
 * @param prompt The current user prompt.
 * @param memories An array of 'memory' type notes.
 * @returns The content of the most relevant memory note as a string, or null if no relevant memory is found.
 */
export const findRelevantMemory = async (prompt: string, memories: Note[]): Promise<string | null> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    if (memories.length === 0) return null;

    // Create a simplified list of memories for the prompt
    const memoryList = memories.map(note => {
        if (note.content.type === 'memory') {
            return `ID: ${note.id}\nUser: ${note.content.userPrompt}\nAgent: ${note.content.agentResponse}\n---`;
        }
        return '';
    }).join('\n');

    const systemInstruction = `You are a memory retrieval system. Your task is to determine which of the following past conversations is most relevant to the user's current query. Respond ONLY with the numeric ID of the most relevant conversation. If none are relevant, respond with "NONE".`;
    
    const fullPrompt = `PAST CONVERSATIONS:\n${memoryList}\n\nCURRENT USER QUERY: "${prompt}"\n\nMOST RELEVANT ID:`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            systemInstruction,
            temperature: 0,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }
    const relevantIdText = response.text.trim();
    if (relevantIdText.toUpperCase() === "NONE" || !/^\d+$/.test(relevantIdText)) {
        return null;
    }
    
    const relevantId = parseInt(relevantIdText, 10);
    const relevantNote = memories.find(note => note.id === relevantId);

    if (relevantNote && relevantNote.content.type === 'memory') {
        console.log(`Memory System: Found relevant context from Memory ID ${relevantId}`);
        return `User asked: "${relevantNote.content.userPrompt}"\nYou responded: "${relevantNote.content.agentResponse}"`;
    }
    
    return null;
}));


/**
 * NEW: Analyzes an image and generates a character profile (appearance and personality).
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to an object with appearance and personality strings.
 */
export const generateCharacterProfileFromImage = async (base64Data: string, mimeType: string): Promise<{ appearance: string; personality: string; }> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Analyze the character in this image. Based on their visual appearance, clothing, expression, and any contextual clues, provide:
1. A detailed 'appearance' description suitable for re-generating this character in future images. Be specific about facial features, hair, build, and attire.
2. An inferred 'personality' description, including their likely demeanor, backstory, and traits.`
    };

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    appearance: {
                        type: Type.STRING,
                        description: 'A detailed physical description of the character, including facial features, hair, clothing, and build.'
                    },
                    personality: {
                        type: Type.STRING,
                        description: 'An inferred personality profile, including traits, demeanor, and potential backstory based on visual cues.'
                    }
                }
            }
        }
    });

    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }
    try {
        const result = JSON.parse(response.text);
        if (typeof result.appearance === 'string' && typeof result.personality === 'string') {
            return result;
        }
        throw new Error("Invalid JSON structure in response.");
    } catch (e) {
        console.error("Failed to parse character profile from Gemini response:", response.text, e);
        throw new Error("The AI failed to generate a valid character profile. The response was not in the expected format.");
    }
}));

/**
 * NEW: Transcribe audio file to text using Web Speech API (browser-based)
 * For production, you'd want to use a proper transcription service
 * @param audioFile The audio file to transcribe
 * @returns Transcribed text
 */
export const transcribeAudio = async (audioFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Convert audio file to a playable URL
        const audioUrl = URL.createObjectURL(audioFile);
        const audio = new Audio(audioUrl);
        
        // Use Web Speech API for transcription
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            let fullTranscript = '';
            
            recognition.onresult = (event: any) => {
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        fullTranscript += event.results[i][0].transcript + ' ';
                    }
                }
            };
            
            recognition.onend = () => {
                URL.revokeObjectURL(audioUrl);
                resolve(fullTranscript.trim());
            };
            
            recognition.onerror = (event: any) => {
                URL.revokeObjectURL(audioUrl);
                reject(new Error(`Speech recognition error: ${event.error}`));
            };
            
            // Start recognition when audio plays
            audio.addEventListener('play', () => {
                recognition.start();
            });
            
            audio.addEventListener('ended', () => {
                recognition.stop();
            });
            
            audio.play();
        } else {
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Speech recognition not supported in this browser'));
        }
    });
};

/**
 * NEW: Analyze audio transcription using Gemini
 * @param transcription The transcribed text from audio
 * @param fileName Original audio file name
 * @returns Analysis of the audio content
 */
export const analyzeAudioTranscription = async (transcription: string, fileName: string): Promise<string> => geminiApiLimiter.schedule(() => handleGeminiError(async () => {
    const systemInstruction = `You are Agent Lee, an expert audio content analyst. Analyze the provided transcription and provide insights including:
    1. Key topics discussed
    2. Emotional tone and sentiment
    3. Action items or important points
    4. Speaker characteristics (if discernible)
    5. Summary of main content
    
    Be thorough but concise in your analysis.`;

    const response = await ensureAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Audio File: ${fileName}\n\nTranscription:\n${transcription}`,
        config: {
            systemInstruction,
            temperature: 0.3,
        },
    });

    if (!response.text) {
        throw new Error("No analysis received from Gemini");
    }

    return response.text;
}));


// createChat is used by the CommunicationControl component
export const createChat = (userName?: string): Chat => {
    // Build the comprehensive system prompt for Agent Lee
    const systemInstruction = buildAgentLeeSystemPrompt(userName);

    return ensureAI().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        }
    });
};
