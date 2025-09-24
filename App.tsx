/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_MULTITOOL_CORE
COLOR_ONION_HEX: NEON=#FF8C00 FLUO=#FFA500 PASTEL=#FFD700
ICON_FAMILY: lucide
ICON_GLYPH: bot
ICON_SIG: AL001001
5WH: WHAT=Agent Lee Multi-Tool Core Application; WHY=Classified Intelligence Hub with multi-modal AI capabilities; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\App.tsx; WHEN=2025-09-22; HOW=React+TypeScript with Gemini AI integration
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
import React, { useState, useRef, useEffect, useContext, Suspense, useCallback } from 'react';
import type { Feature, ResearchMode, GroundingChunk, Note, AgentState, TransmissionLogEntry, NoteContent, Contact, Character, CallQueueItem } from './types';
import TextGenerator from './components/TextGenerator';
import Researcher from './components/Researcher';
import PersistentActions from './components/PersistentActions';
import { NotepadProvider, NotepadContext } from './contexts/NotepadContext';
import { CharacterProvider, CharacterContext } from './contexts/CharacterContext';
import * as geminiService from './services/geminiService';
import * as ttsService from './services/ttsService'; // Import TTS Service
import { parseFile, ParsedFile } from './utils/fileParser';
import LoadingSpinner from './components/LoadingSpinner';
import { markdownToHtml } from './utils/markdown';
import AgentAvatar from './components/AgentAvatar';
import CameraFeed, { CameraFeedHandle } from './components/CameraFeed';
// import AgentOutput from './components/AgentOutput'; // Removed - using conversation popup instead
import type { Chat } from '@google/genai'; // Import Chat type
import { finalizeSpokenOutput } from './src/prompts'; // Import the centralized text cleaner
import Spotlight from './components/Spotlight';
import OnboardingGuide from './components/OnboardingGuide';
import InAppBrowser from './components/InAppBrowser';
import LeewayDiagnostics, { logDiagnostic } from './components/LeewayDiagnostics';
import { sanitizeInput, validatePromptBoundaries, scanModelOutput, rateLimiter } from './utils/security';

// New imports for multi-engine image generation
import { generateImage as generateImageWithRouter } from './src/engines/engine.router';
import type { GenOut } from './src/engines/engine.types';
import { USE_LOCAL_ONLY } from './src/config';

// Lazy-load heavier components for faster initial load
const ImageStudio = React.lazy(() => import('./components/ImageStudio'));
const MediaAnalyzer = React.lazy(() => import('./components/MediaAnalyzer'));
const AudioAnalyzer = React.lazy(() => import('./components/AudioAnalyzer'));
const DocumentAnalyzer = React.lazy(() => import('./components/DocumentAnalyzer'));
const CommunicationControl = React.lazy(() => import('./components/CommunicationControl'));
const EmailClient = React.lazy(() => import('./components/EmailClient'));
const AgentNotepad = React.lazy(() => import('./components/AgentNotepad'));
const Settings = React.lazy(() => import('./components/Settings'));
//#endregion

//#region Init
// SpeechRecognition API interfaces for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    __LOCAL_ONLY__?: boolean;
  }
}

// Local-only fetch guard
if (USE_LOCAL_ONLY) {
    const _fetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
      if (window.__LOCAL_ONLY__ && !(url.startsWith(location.origin) || url.startsWith('blob:') || url.startsWith('data:'))) {
        const errorMessage = `Blocked egress in LOCAL_ONLY mode: ${url}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      return _fetch(input as any, init);
    };
    window.__LOCAL_ONLY__ = true;
}

// Type definitions
type ImageStudioState = {
    mode: 'text-to-image' | 'image-edit';
    baseImage: { dataUrl: string; mimeType: string; name: string } | null;
    selectedCharacterId: number | null;
};
//#endregion

//#region Public API
const AppContent: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<Feature>('research');
    const [promptInput, setPromptInput] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    
    // Conversation Popup States
    const [isConversationPopupOpen, setIsConversationPopupOpen] = useState(false);
    const [conversationContent, setConversationContent] = useState('');
    const [conversationSaveTimer, setConversationSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [currentConversation, setCurrentConversation] = useState({ user: '', agent: '' });
    
    // Agent Lee States
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [isListening, setIsListening] = useState(false);
    const [isAlwaysListening, setIsAlwaysListening] = useState(false);
    const [autoSendTimer, setAutoSendTimer] = useState<NodeJS.Timeout | null>(null);
    const [isWakeWordActive, setIsWakeWordActive] = useState(true); // Always listening for "Agent Lee"
    const isAlwaysListeningRef = useRef(isAlwaysListening);
    isAlwaysListeningRef.current = isAlwaysListening;
    
    // NEW: State for interruption handling
    const [interruptedResponse, setInterruptedResponse] = useState<TransmissionLogEntry | null>(null);

    const [agentTransmissionLog, setAgentTransmissionLog] = useState<TransmissionLogEntry[]>(() => {
        try {
            const savedLog = localStorage.getItem('agent-lee-transmission-log');
            return savedLog ? JSON.parse(savedLog) : [];
        } catch (error) {
            console.error('Failed to load transmission log from localStorage:', error);
            return [];
        }
    });
    
    // --- NEW: Onboarding and User State ---
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => localStorage.getItem('onboardingComplete') === 'true');
    const [placeholderText, setPlaceholderText] = useState("Awaiting orders...");
    const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('userName'));

    
    const [results, setResults] = useState({
        text: '',
        research: { text: '', sources: [] as GroundingChunk[] },
        images: [] as GenOut[], // Changed to store multiple images
        analyze: '',
        document: '',
        audio: '', // Audio transcription results
    });
    
    // NEW: State to trigger auto-submission after navigation
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

    // NEW: State for automatic conversation saving
    const [conversationTurns, setConversationTurns] = useState<{ user: string; agent: string }[]>([]);

    // NEW: State for passing a number to the call component
    const [numberToCall, setNumberToCall] = useState<string | null>(null);

    // NEW: State for in-app browser
    const [browserUrl, setBrowserUrl] = useState<string | null>(null);

    // NEW: Character and background consistency states
    const [consistentCharacters, setConsistentCharacters] = useState<Array<{
        id: string;
        name: string;
        description: string;
        imageUrl: string;
    }>>([]);
    
    const [consistentBackgrounds, setConsistentBackgrounds] = useState<Array<{
        id: string;
        name: string;
        description: string;
        imageUrl: string;
    }>>([]);

    // NEW: State for the Image Studio feature
    const [imageStudioState, setImageStudioState] = useState<ImageStudioState>({
        mode: 'text-to-image',
        baseImage: null,
        selectedCharacterId: null,
    });


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [researchMode, setResearchMode] = useState<ResearchMode>('general');

    const cameraFeedRef = useRef<CameraFeedHandle>(null);
    
    // Refs for new voice interaction system
    const chatRef = useRef<Chat | null>(null);
    const recognitionRef = useRef<any>(null);


    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisModalContent, setAnalysisModalContent] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);

    // NEW: State to hold a visual query that is pending camera activation
    const [pendingVisualQuery, setPendingVisualQuery] = useState<string | null>(null);

    const { notes, addNote, setActiveNoteId, activeNoteId } = useContext(NotepadContext);
    const { characters } = useContext(CharacterContext);
    
    const commonSvgProps = {
        className: "w-8 h-8",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        strokeWidth: "1.5",
        stroke: "currentColor",
        fill: "none",
        strokeLinecap: "round" as "round",
        strokeLinejoin: "round" as "round",
    };

    const tabs: { id: Feature; imagePath: string; label: string; }[] = [
        { id: 'research', imagePath: '/reasearch.png', label: 'Research' },
        { id: 'text', imagePath: '/text.png', label: 'Text' },
        { id: 'image', imagePath: '/image.png', label: 'Image Studio' },
        { id: 'analyze', imagePath: '/analyze.png', label: 'Analyze' },
        { id: 'document', imagePath: '/documents.png', label: 'Document' },
        { id: 'audio', imagePath: '/analyze.png', label: 'Audio' }, // Using analyze icon for now
        { id: 'call', imagePath: '/call.png', label: 'Call' },
        { id: 'email', imagePath: '/email.png', label: 'Email' },
        { id: 'notepad', imagePath: '/notepad.png', label: 'Notepad' },
        { id: 'settings', imagePath: '/settings.png', label: 'Settings' },
    ];
    
    // NEW: agent action types and parsing/execution logic
    interface AgentAction {
        name: string;
        params: any;
    }

    const parseAgentActions = (responseText: string): { cleanedText: string, actions: AgentAction[] } => {
        const actionRegex = /\[ACTION:\s*([\w_]+),\s*({.*?})\]/g;
        const actions: AgentAction[] = [];
        let match;
        
        // Use a while loop to find all matches, as exec() with /g flag maintains state
        while ((match = actionRegex.exec(responseText)) !== null) {
            try {
                const actionName = match[1];
                const params = JSON.parse(match[2]);
                actions.push({ name: actionName, params });
            } catch (e) {
                console.error("Failed to parse agent action params:", match[2], e);
            }
        }
        
        // Clean the action tags from the text that will be shown to the user
        const cleanedText = responseText.replace(actionRegex, '').trim();

        return { cleanedText, actions };
    };
    
    // NEW: Robust function to handle auto image generation
    const handleAutoImageGeneration = async (prompt: string) => {
        setActiveFeature('image');
        setPromptInput(prompt); // Set prompt for UI consistency
        setLoading(true);
        setError('');
        setAgentState('thinking');
        
        try {
            const imageResult = await generateImageWithRouter({ prompt });
            setResults(prev => ({ ...prev, images: [imageResult, ...prev.images] })); // Prepend new image
            
            // Automatically save to notepad
            if (imageResult.type === 'base64') {
                const noteContent: NoteContent = {
                    type: 'image',
                    imageUrl: `data:image/png;base64,${imageResult.data}`,
                    prompt: prompt,
                };
                addNote(`Image: ${prompt.substring(0, 40)}...`, noteContent, "VISUAL");
            }

        } catch (err: any) {
            const errorMessage = err?.message || 'An unknown error occurred during image generation.';
            setError(errorMessage);
            appendToLog('SYSTEM', `Error: ${errorMessage}`);
        } finally {
            setLoading(false);
            setAgentState('idle');
        }
    };


    const executeAgentAction = (action: AgentAction) => {
        console.log("Executing agent action:", action);
        switch(action.name) {
            case 'browse_web':
                if (action.params.search_query) {
                    const query = encodeURIComponent(action.params.search_query);
                    setBrowserUrl(`https://lite.duckduckgo.com/lite/?q=${query}`);
                    appendToLog('SYSTEM', `[System: Opening in-app browser to search for "${action.params.search_query}"]`);
                }
                break;
            case 'navigate':
                if (action.params.tab && tabs.some(t => t.id === action.params.tab)) {
                    handleTabClick(action.params.tab);
                    appendToLog('SYSTEM', `[System: Agent Lee is navigating to the ${action.params.tab} tab.]`);
                    if (action.params.followUpPrompt) {
                        setPromptInput(action.params.followUpPrompt);
                        setIsAutoSubmitting(true); // Trigger auto-submission
                    }
                }
                break;
            case 'generate_image':
                if (action.params.prompt) {
                    appendToLog('SYSTEM', `[System: Agent Lee is generating an image with prompt: "${action.params.prompt}"]`);
                    handleAutoImageGeneration(action.params.prompt);
                }
                break;
            case 'initiate_call': {
                const contactName = action.params.contact_name;
                let targetNumber = action.params.phone_number;
                
                let script = '';

                if (contactName) {
                    const contacts: Contact[] = JSON.parse(localStorage.getItem('agent-lee-contacts') || '[]');
                    const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
                    if (contact) {
                        targetNumber = contact.phone;
                        script = `Found ${contact.name}. Opening your phone's dialer now.`;
                    } else {
                        script = `Contact "${contactName}" not found. You can add them in Settings.`;
                    }
                } else if (targetNumber) {
                    script = `Understood. I'm opening your phone's dialer with the number ${targetNumber}.`;
                } else {
                    script = `I need a contact name or a phone number to initiate a call.`;
                }

                appendToLog('SYSTEM', `[System: ${script}]`);
                setAgentState('speaking');
                ttsService.speak(finalizeSpokenOutput(script), () => {}, () => {
                    if (targetNumber) {
                        setNumberToCall(targetNumber);
                        handleTabClick('call');
                    }
                    setAgentState('idle');
                });
                break;
            }
            case 'list_contacts': {
                const contacts: Contact[] = JSON.parse(localStorage.getItem('agent-lee-contacts') || '[]');
                let responseText;
                if (contacts.length > 0) {
                    const contactNames = contacts.map(c => c.name).join(', ');
                    responseText = `Here are your saved contacts: ${contactNames}. Who would you like to call?`;
                } else {
                    responseText = "You have no contacts saved. You can add them in the Settings tab.";
                }
                appendToLog('SYSTEM', responseText);
                setAgentState('speaking');
                ttsService.speak(finalizeSpokenOutput(responseText), () => {}, () => setAgentState('idle'));
                break;
            }
            default:
                console.warn("Unknown agent action:", action.name);
        }
    };
    
    // NEW: Effect for auto-saving conversations
    useEffect(() => {
        if (conversationTurns.length >= 3) {
            const userPrompts = conversationTurns.map(t => t.user).join('\n---\n');
            const agentResponses = conversationTurns.map(t => t.agent).join('\n---\n');
            
            const noteContent: NoteContent = {
                type: 'memory',
                userPrompt: userPrompts,
                agentResponse: agentResponses
            };
            
            const title = `Memory: ${conversationTurns[0].user.substring(0, 40)}...`;
            addNote(title, noteContent, 'MEMORY');
            
            // Clear the state for the next batch
            setConversationTurns([]);
            // Clear the visual transmission log as requested
            setAgentTransmissionLog([]);
        }
    }, [conversationTurns, addNote]);


    // Save transmission log to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('agent-lee-transmission-log', JSON.stringify(agentTransmissionLog));
        } catch (error) {
            console.error('Failed to save transmission log to localStorage:', error);
        }
    }, [agentTransmissionLog]);
    
    const appendToLog = (speaker: 'USER' | 'AGENT' | 'SYSTEM', text: string) => {
        setAgentTransmissionLog(prev => {
            const newLog = [...prev, { id: Date.now(), speaker, text, timestamp: new Date().toISOString() }];
            // Limit log size to prevent performance issues
            if (newLog.length > 200) {
                return newLog.slice(newLog.length - 200);
            }
            return newLog;
        });
    };
    
    // New handler for streaming text to create a "typing" effect
    const appendToLastAgentLog = (chunk: string) => {
        setAgentTransmissionLog(prev => {
            if (prev.length === 0) {
                 return [{ id: Date.now(), speaker: 'AGENT', text: chunk, timestamp: new Date().toISOString() }];
            }
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === 'AGENT') {
                const newLog = [...prev];
                newLog[newLog.length - 1] = { ...lastEntry, text: lastEntry.text + chunk };
                return newLog;
            } else {
                return [...prev, { id: Date.now(), speaker: 'AGENT', text: chunk, timestamp: new Date().toISOString() }];
            }
        });
    };
    

    // --- New Voice Interaction Logic ---
    
    // NEW: Function to get relevant context from memory (Notepad)
    const getMemoryContext = async (prompt: string): Promise<string | null> => {
        const memoryNotes = notes.filter(n => n.content.type === 'memory');
        if (memoryNotes.length === 0) {
            return null;
        }
        try {
            return await geminiService.findRelevantMemory(prompt, memoryNotes);
        } catch (error) {
            console.error("Failed to retrieve context from memory:", error);
            return null;
        }
    };


    const sendTranscriptToGemini = async (transcript: string) => {
        if (!chatRef.current || !transcript) return;
        
        setAgentState('thinking');
        appendToLog('USER', transcript);
        setPromptInput(''); // Clear input after sending
        setInterruptedResponse(null); // Clear any pending interruptions

        try {
            const memoryContext = await getMemoryContext(transcript);
            
            const activeCharacter = imageStudioState.selectedCharacterId ? characters.find(c => c.id === imageStudioState.selectedCharacterId) : null;
            const characterContext = activeCharacter ? `
---
ACTIVE CHARACTER PROFILE (for consistency):
- Name: ${activeCharacter.name}
- Appearance: ${activeCharacter.appearance}
- Personality: ${activeCharacter.personality}
---
` : '';

            const finalTranscript = [
                memoryContext ? `CONTEXT FROM PREVIOUS INTERACTION:\n${memoryContext}` : '',
                characterContext,
                `CURRENT USER REQUEST:\n${transcript}`
            ].filter(Boolean).join('\n\n');

            let responseStream;
            
            // If the user uploads a file for analysis, we need to handle it here.
            if (activeFeature === 'analyze' && mediaFile) {
                 const { base64, mimeType } = await parseFile(mediaFile);
                 if (!base64 || !mimeType) throw new Error("The selected file is not a supported media type.");
                 responseStream = geminiService.generateContentStreamMultiModal(finalTranscript, base64, mimeType);
                 setMediaFile(null); // Consume the file
            } else if (activeFeature === 'document' && documentFile) {
                const { content } = await parseFile(documentFile);
                const docPrompt = `Please analyze the following document and answer the user's question.\n\nDOCUMENT:\n"""\n${content}\n"""\n\nQUESTION:\n"""\n${finalTranscript}\n"""\n\nANALYSIS:`;
                responseStream = await chatRef.current.sendMessageStream({ message: docPrompt });
                setDocumentFile(null); // Consume the file
            }
            else {
                // Step 1: Classify if the request requires visual context
                const isVisualQuery = await geminiService.classifyVisualRequest(transcript);

                // Step 2a: If visual, check camera, prompt if needed, or capture frame
                if (isVisualQuery && cameraFeedRef.current) {
                    if (!cameraFeedRef.current.isReady()) {
                        setPendingVisualQuery(transcript); // Save prompt
                        const message = "I need to use the visual feed for that, but it's not active. Please click 'Enable Camera' below, and I'll proceed.";
                        appendToLog('AGENT', message);
                        setAgentState('speaking');
                        await ttsService.speak(finalizeSpokenOutput(message), () => {}, () => setAgentState('idle'));
                        return; // Stop processing and wait for user to enable camera
                    }

                    appendToLog('SYSTEM', '[System: Visual query detected. Capturing frame...]');
                    const frameDataUrl = cameraFeedRef.current.captureFrame();

                    if (frameDataUrl) {
                        const [, base64Data] = frameDataUrl.split(',');
                        responseStream = await geminiService.generateContentStreamMultiModal(finalTranscript, base64Data, 'image/jpeg');
                    } else {
                        appendToLog('SYSTEM', '[System: Frame capture failed. Proceeding with text only.]');
                        responseStream = await chatRef.current.sendMessageStream({ message: finalTranscript });
                    }
                } else {
                    // Step 2b: Standard text-only chat
                    responseStream = await chatRef.current.sendMessageStream({ message: finalTranscript });
                }
            }

            
            // Step 3: Process the stream
            let fullResponse = "";
            let firstChunk = true;
            
            // Ensure responseStream is properly awaited if it's a Promise
            const resolvedStream = await responseStream;

            for await (const chunk of resolvedStream) {
                if (firstChunk) {
                    appendToLog('AGENT', ""); // Create empty entry for streaming
                    firstChunk = false;
                }
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    appendToLastAgentLog(chunkText); // Stream to UI log
                }
            }
            
            // Step 4: Parse actions from the full response
            const { cleanedText, actions } = parseAgentActions(fullResponse);
            
            // Update the final log entry with the cleaned text so the user doesn't see action tags
            setAgentTransmissionLog(prev => {
                const newLog = [...prev];
                if (newLog.length > 0 && newLog[newLog.length - 1].speaker === 'AGENT') {
                    newLog[newLog.length - 1].text = cleanedText;
                }
                return newLog;
            });
            
            // Add to conversation history for auto-saving
            setConversationTurns(prev => [...prev, { user: transcript, agent: cleanedText }]);
            
            // Update current conversation and show popup
            setCurrentConversation({ user: transcript, agent: cleanedText });
            showConversationPopup(cleanedText);

            // FIX: Pipe the agent's response to the active feature's result state.
            // This ensures that when the agent performs a task (e.g., writing a story),
            // the result appears in the correct UI component (e.g., TextGenerator).
            switch (activeFeature) {
                case 'text':
                    setResults(prev => ({ ...prev, text: cleanedText }));
                    break;
                case 'research':
                    // Note: When the agent handles research, it uses its general knowledge.
                    // It doesn't have access to the googleSearch tool in this conversational flow,
                    // so sources will be empty. We still display the text response.
                    setResults(prev => ({ ...prev, research: { text: cleanedText, sources: [] } }));
                    break;
                case 'analyze':
                    setResults(prev => ({ ...prev, analyze: cleanedText }));
                    break;
                case 'document':
                    setResults(prev => ({ ...prev, document: cleanedText }));
                    break;
                default:
                    // For other features like 'image', 'call', etc., the result is handled
                    // differently (e.g., direct image generation, side effects) or there's no text output.
                    break;
            }


            // Step 5: Speak the cleaned response
            setAgentState('speaking');
            const cleanResponseForSpeech = finalizeSpokenOutput(cleanedText);
            await ttsService.speak(
                cleanResponseForSpeech,
                () => {}, // onBoundary
                () => { 
                    setAgentState('idle'); 
                    // Step 6: Execute actions after speech is complete
                    if (actions.length > 0) {
                        actions.forEach(executeAgentAction);
                    }
                }
            );

        } catch (err: any) {
            const errorMessage = err?.message || 'An unknown error occurred.';
            setError(errorMessage);
            appendToLog('SYSTEM', `Error: ${errorMessage}`);
            setAgentState('idle');
        } finally {
            setLoading(false);
        }
    };
    
    const initializeChat = useCallback(() => {
        chatRef.current = geminiService.createChat(userName || 'Operator');
    }, [userName]);

    // Effect to manage onboarding and chat initialization
    useEffect(() => {
        if (isOnboardingComplete) {
            initializeChat();
        }
    }, [isOnboardingComplete, initializeChat]);


    // This effect runs once on mount to initialize services
    useEffect(() => {
        ttsService.initTts();
        
        if (!recognitionRef.current) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setError("Speech recognition not supported by this browser. Voice input disabled.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening even after pauses
            recognition.interimResults = true;
            recognitionRef.current = recognition;
        }
    }, []);

    //#region I/O
    // FIX: Simplified handleSubmit to always use the conversational agent.
    // This fixes the "stuck in a mode" bug.
    const handleSubmit = async (text: string) => {
        const currentPrompt = text.trim();
        if (!currentPrompt || !isOnboardingComplete) {
            logDiagnostic({
                level: 'WARN',
                module: 'App',
                operation: 'handleSubmit',
                message: 'Submit blocked: empty prompt or onboarding incomplete',
                data: { currentPrompt, isOnboardingComplete },
                file_path: 'App.tsx',
                line: 598
            });
            return;
        }

        // Rate limiting check
        const userId = userName || 'anonymous';
        if (!rateLimiter.isAllowed(userId, 30, 60000)) { // 30 requests per minute
            setError('Rate limit exceeded. Please wait before submitting again.');
            logDiagnostic({
                level: 'WARN',
                module: 'App',
                operation: 'handleSubmit',
                message: 'Request blocked by rate limiter',
                data: { userId },
                file_path: 'App.tsx',
                line: 611
            });
            return;
        }

        // Sanitize and validate input
        const sanitizationResult = sanitizeInput(currentPrompt, {
            maxLength: 5000,
            allowHtml: false,
            allowScripts: false,
            allowUrls: true
        });

        if (!sanitizationResult.isValid) {
            setError('Input validation failed: ' + sanitizationResult.errors.join(', '));
            logDiagnostic({
                level: 'ERROR',
                module: 'App',
                operation: 'handleSubmit',
                message: 'Input validation failed',
                data: { errors: sanitizationResult.errors },
                file_path: 'App.tsx',
                line: 628
            });
            return;
        }

        // Validate prompt boundaries
        const boundaryResult = validatePromptBoundaries('', sanitizationResult.sanitized);
        if (!boundaryResult.isValid) {
            setError('Prompt injection detected. Please rephrase your request.');
            logDiagnostic({
                level: 'ERROR',
                module: 'App',
                operation: 'handleSubmit',
                message: 'Prompt injection attempt blocked',
                data: { errors: boundaryResult.errors },
                file_path: 'App.tsx',
                line: 638
            });
            return;
        }

        const sanitizedPrompt = sanitizationResult.sanitized;

        logDiagnostic({
            level: 'INFO',
            module: 'App',
            operation: 'handleSubmit',
            message: `Processing ${activeFeature} request`,
            data: { activeFeature, promptLength: sanitizedPrompt.length, warnings: sanitizationResult.warnings },
            file_path: 'App.tsx',
            line: 649
        });

        setLoading(true);
        setError('');
        setAgentState('thinking');

        try {
            if (activeFeature === 'audio') {
                if (audioFile) {
                    appendToLog('USER', `Analyzing audio file: ${audioFile.name}`);
                    
                    // Transcribe the audio
                    const transcription = await geminiService.transcribeAudio(audioFile);
                    
                    // Analyze the transcription
                    const analysis = await geminiService.analyzeAudioTranscription(transcription, audioFile.name);
                    
                    // Convert audio file to base64 for storage
                    const base64Audio = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(audioFile);
                    });
                    
                    const [header, base64Data] = base64Audio.split(',');
                    
                    // Save to results
                    setResults(prev => ({ ...prev, audio: analysis }));
                    
                    // Save to notepad with full audio data
                    addNote(`Audio: ${audioFile.name}`, {
                        type: 'audio',
                        transcription,
                        fileName: audioFile.name,
                        audioData: {
                            base64: base64Data,
                            mimeType: audioFile.type,
                        }
                    }, 'AUDIO');
                    
                    appendToLog('AGENT', analysis);
                } else {
                    appendToLog('AGENT', 'Please upload an audio file to analyze.');
                }
            } else if (activeFeature === 'image') {
                const { mode, baseImage, selectedCharacterId } = imageStudioState;
                const character = characters.find(c => c.id === selectedCharacterId);
                let finalPrompt = sanitizedPrompt;
                let loadingMessage = "Generating image...";

                if (character) {
                    finalPrompt = `A detailed image of a character with the following features: ${character.appearance}. The character is described as: ${character.personality}. The scene is: ${text}`;
                    loadingMessage = `Generating image with character: ${character.name}...`;
                }

                appendToLog('USER', text);
                let newImage: string;

                if (mode === 'image-edit' && baseImage) {
                    loadingMessage = `Editing image: ${baseImage.name}...`;
                    const [header, base64Data] = baseImage.dataUrl.split(',');
                    if (!base64Data) throw new Error("Invalid base image data.");
                    newImage = await geminiService.editImage(finalPrompt, base64Data, baseImage.mimeType);
                } else {
                    newImage = await geminiService.generateImage(finalPrompt);
                }
                
                const [, base64Data] = newImage.split(',');
                const newGenOut: GenOut = { type: 'base64', data: base64Data };

                setResults(prev => ({ ...prev, images: [newGenOut, ...prev.images] }));
                
                // Save to notepad
                addNote(`Image: ${text.substring(0, 40)}...`, {
                    type: 'image',
                    imageUrl: newImage,
                    prompt: text,
                }, 'VISUAL');
                
                appendToLog('AGENT', `[System: Image generation complete. Result displayed in the Image Studio.]`);

            } else {
                // All other prompts go through the main agent logic
                await sendTranscriptToGemini(sanitizedPrompt);
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'An unknown error occurred.';
            setError(errorMessage);
            appendToLog('SYSTEM', `Error: ${errorMessage}`);
        } finally {
            setAgentState('idle');
            setLoading(false);
            setPromptInput('');
        }
    };

    const handleSubmitCallback = useCallback(handleSubmit, [activeFeature, systemInstruction, researchMode, mediaFile, documentFile, audioFile, sendTranscriptToGemini, isOnboardingComplete, appendToLog, setAgentState, setLoading, setError, setResults, setPromptInput, userName, characters, imageStudioState]);
    
    // NEW: Effect to handle auto-submission after navigation
    useEffect(() => {
        if (isAutoSubmitting && !loading && promptInput) {
            handleSubmitCallback(promptInput);
            setIsAutoSubmitting(false); // Reset the trigger
        }
    }, [isAutoSubmitting, loading, promptInput, handleSubmitCallback]);


    // Effect to attach and update STT event handlers
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        recognition.onstart = () => {
            setAgentState('listening');
            setIsListening(true);
            // Clear any existing auto-send timer
            if (autoSendTimer) {
                clearTimeout(autoSendTimer);
                setAutoSendTimer(null);
            }
        };

        recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            
            // Check for wake word "Agent Lee"
            const lowerTranscript = fullTranscript.toLowerCase();
            if (lowerTranscript.includes('agent lee') && !isAlwaysListening) {
                setIsAlwaysListening(true);
                // Remove "Agent Lee" from the transcript
                fullTranscript = fullTranscript.replace(/agent lee/gi, '').trim();
            }
            
            setPromptInput(fullTranscript);
            
            // Clear existing timer and set new one for auto-send after 4 seconds of silence
            if (autoSendTimer) {
                clearTimeout(autoSendTimer);
            }
            
            const newTimer = setTimeout(() => {
                const finalTranscript = fullTranscript.trim();
                if (finalTranscript && (isAlwaysListening || lowerTranscript.includes('agent lee'))) {
                    recognition.stop();
                    handleSubmitCallback(finalTranscript);
                }
            }, 4000); // 4 seconds of silence
            
            setAutoSendTimer(newTimer);
        };

        recognition.onend = () => {
            setIsListening(false);
            
            // Clear auto-send timer
            if (autoSendTimer) {
                clearTimeout(autoSendTimer);
                setAutoSendTimer(null);
            }
            
            // If in always-on mode, restart listening
            if (isAlwaysListening && agentState !== 'thinking') {
                setTimeout(() => {
                    if (agentState === 'idle') {
                        recognition.start();
                    }
                }, 500); // Brief pause before restarting
            }
        };
        
        recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
                 console.error("Speech Recognition Error:", event.error);
                 setError(`Speech Recognition Error: ${event.error}`);
            }
            setIsListening(false);
            
            // Clear auto-send timer on error
            if (autoSendTimer) {
                clearTimeout(autoSendTimer);
                setAutoSendTimer(null);
            }
        };

        // Cleanup function
        return () => {
            if (autoSendTimer) {
                clearTimeout(autoSendTimer);
            }
        };

    }, [promptInput, handleSubmitCallback, isAlwaysListening, autoSendTimer, agentState]);

    // This is now the master controller for the "always listening" loop.
    // It starts, stops, and restarts listening based on the application state.
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        // Condition to START listening:
        // 1. User has enabled "always on" mode.
        // 2. The agent is idle (not thinking or speaking).
        if (isAlwaysListening && agentState === 'idle') {
            ttsService.cancel();
            recognition.start();
        } 
        // Condition to STOP listening:
        // 1. User has disabled "always on" mode.
        else if (!isAlwaysListening) {
            recognition.stop();
        }
    }, [isAlwaysListening, agentState]);

    // Background wake word listener - always active when not in conversation
    useEffect(() => {
        if (!isWakeWordActive || typeof window === 'undefined') return;

        let wakeWordRecognition: any = null;

        const startWakeWordListener = () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                wakeWordRecognition = new SpeechRecognition();
                wakeWordRecognition.continuous = true;
                wakeWordRecognition.interimResults = true;
                wakeWordRecognition.lang = 'en-US';

                wakeWordRecognition.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = 0; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript.toLowerCase();
                    }

                    if (transcript.includes('agent lee') && !isAlwaysListening && !isListening) {
                        // Wake word detected! Activate main listening
                        setIsAlwaysListening(true);
                        wakeWordRecognition.stop();
                    }
                };

                wakeWordRecognition.onerror = (event: any) => {
                    if (event.error !== 'no-speech') {
                        console.log('Wake word listener error:', event.error);
                    }
                    // Restart after brief delay
                    setTimeout(startWakeWordListener, 1000);
                };

                wakeWordRecognition.onend = () => {
                    // Restart wake word listener if still active and not in conversation
                    if (isWakeWordActive && !isAlwaysListening && !isListening) {
                        setTimeout(startWakeWordListener, 500);
                    }
                };

                try {
                    wakeWordRecognition.start();
                } catch (error) {
                    console.log('Wake word recognition start error:', error);
                }
            }
        };

        // Start wake word listener only when not actively listening
        if (!isAlwaysListening && !isListening) {
            startWakeWordListener();
        }

        return () => {
            if (wakeWordRecognition) {
                wakeWordRecognition.stop();
                wakeWordRecognition = null;
            }
        };
    }, [isWakeWordActive, isAlwaysListening, isListening]);

    //#endregion

    //#region Internals

    const handleMicToggle = () => {
        // NEW: Handle interruption
        if (agentState === 'speaking') {
            ttsService.cancel();
            const lastAgentResponse = [...agentTransmissionLog].reverse().find(entry => entry.speaker === 'AGENT');
            if (lastAgentResponse) {
                setInterruptedResponse(lastAgentResponse);
            }
        }
        setIsAlwaysListening(prev => !prev);
    };


    // --- End of New Voice Interaction Logic ---

    const applyNoteToPrompt = (note: Note) => {
        let targetFeature: Feature = 'text';
        if (note.content.type === 'text' || note.content.type === 'analysis' || note.content.type === 'call') {
            setPromptInput(note.content.text);
            targetFeature = 'text';
        } else if (note.content.type === 'research') {
             setPromptInput(note.content.text);
             targetFeature = 'research';
        } else if (note.content.type === 'image') {
            setPromptInput(note.content.prompt);
            targetFeature = 'image';
        }
        
        setActiveFeature(targetFeature);
        setIsNotePickerOpen(false); 
        
        const input = document.getElementById('central-prompt-input');
        if (input) {
            input.style.transition = 'all 0.1s ease-in-out';
            input.style.transform = 'scale(1.02)';
            setTimeout(() => {
                input.style.transform = 'scale(1)';
            }, 200);
        }
    };
    
    const getActiveResultText = (): string => {
        switch(activeFeature) {
            case 'text': return results.text;
            case 'research': return results.research.text;
            case 'analyze': return results.analyze;
            case 'document': return results.document;
            default: return '';
        }
    };
    
    const currentResultData = {
        text: getActiveResultText(),
        // Use the first image for single-image actions like AI Analysis
        imageUrl: (results.images[0]?.type === 'base64') ? `data:image/png;base64,${results.images[0].data}` : '',
        sources: results.research.sources,
        prompt: promptInput,
        fileName: activeFeature === 'analyze' ? mediaFile?.name : (activeFeature === 'document' ? documentFile?.name : (activeFeature === 'audio' ? audioFile?.name : undefined)),
    };
    
    const handleGlobalAiAnalysis = async () => {
        setIsAnalysisLoading(true);
        setIsAnalysisModalOpen(true);
        setAnalysisModalContent('');

        try {
            let analysis = '';
            if (activeFeature === 'notepad') {
                const activeNote = notes.find(n => n.id === activeNoteId);
                if (!activeNote) throw new Error("No active note to analyze.");

                if (activeNote.content.type === 'image') {
                    const imageUrl = activeNote.content.imageUrl;
                    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
                        throw new Error("No valid image URL available to analyze.");
                    }
                    // TypeScript validation: imageUrl is guaranteed to be a non-empty string here
                    // @ts-ignore: TypeScript doesn't recognize control flow validation
                    analysis = await geminiService.analyzeImageFromUrl("Describe this image in detail. Provide context and identify key objects.", imageUrl);
                } else if (['text', 'research', 'analysis', 'call', 'memory'].includes(activeNote.content.type)) {
                    const textToAnalyze = (activeNote.content.type === 'memory') 
                        ? `User: ${activeNote.content.userPrompt}\nAgent: ${activeNote.content.agentResponse}`
                        : (activeNote.content as any).text;
                    if (!textToAnalyze || typeof textToAnalyze !== 'string') {
                        throw new Error("No text content available to analyze.");
                    }
                    // @ts-ignore - TypeScript doesn't recognize the validation above
                    analysis = await geminiService.analyzeNote(textToAnalyze);
                } else {
                    throw new Error("This note type cannot be analyzed.");
                }
            } else {
                if (activeFeature === 'image' && currentResultData.imageUrl && currentResultData.imageUrl.trim()) {
                    const imageUrl = currentResultData.imageUrl;
                    // TypeScript validation: imageUrl is guaranteed to be a non-empty string here
                    // @ts-ignore: TypeScript doesn't recognize control flow validation
                    analysis = await geminiService.analyzeImageFromUrl("Describe this image in detail. Provide context and identify key objects.", imageUrl);
                } else if (currentResultData.text && currentResultData.text.trim()) {
                    // @ts-ignore - TypeScript doesn't recognize the validation above
                    analysis = await geminiService.analyzeNote(currentResultData.text);
                } else {
                    throw new Error("No content to analyze for the current feature.");
                }
            }
            setAnalysisModalContent(analysis);
        } catch (err: any) {
            setAnalysisModalContent(`Error during analysis: ${(err as Error).message}`);
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    

    const handleTabClick = useCallback((feature: Feature) => {
        setActiveFeature(feature);
    }, []);

    const researchModes: { id: ResearchMode; label: string; imagePath: string }[] = [
        { id: 'general', label: 'General', imagePath: '/general.png' },
        { id: 'academic', label: 'Academic', imagePath: '/academic.png' },
        { id: 'wikipedia', label: 'Wikipedia', imagePath: '/wiki.png' },
    ];

    const handleLogAction = (action: 'save' | 'memory', entry: TransmissionLogEntry) => {
        if (action === 'save') {
             const title = `Log: ${entry.text.substring(0, 30).trim()}${entry.text.length > 30 ? '...' : ''}`;
             const noteText = `**Transmission from ${entry.speaker}**\n*Timestamp: ${new Date(entry.timestamp).toLocaleString()}*\n---\n${entry.text}`;
             const noteContent: NoteContent = { type: 'text', text: noteText };
             addNote(title, noteContent);
        } else if (action === 'memory') {
            const userPromptEntry = [...agentTransmissionLog].reverse().find(e => e.speaker === 'USER' && e.timestamp < entry.timestamp);
            if (userPromptEntry) {
                const title = `Memory: ${userPromptEntry.text.substring(0, 40).trim()}${userPromptEntry.text.length > 40 ? '...' : ''}`;
                const noteContent: NoteContent = { type: 'memory', userPrompt: userPromptEntry.text, agentResponse: entry.text };
                addNote(title, noteContent, 'MEMORY');
            } else {
                // Fallback if no preceding user prompt is found
                addNote(`Memory: ${entry.text.substring(0, 40)}...`, { type: 'memory', userPrompt: 'N/A', agentResponse: entry.text }, 'MEMORY');
            }
        }
    };


    const handleDeleteLogEntry = (id: number) => {
        if (window.confirm("Are you sure you want to permanently delete this message from the log?")) {
            setAgentTransmissionLog(prev => prev.filter(entry => entry.id !== id));
        }
    };
    
    // NEW: Handlers for interruption banner
    const handleResumeInterruption = () => {
        if (interruptedResponse) {
            setAgentState('speaking');
            ttsService.speak(finalizeSpokenOutput(interruptedResponse.text), () => {}, () => {
                setAgentState('idle');
            });
        }
        setInterruptedResponse(null);
    };

    const handleDismissInterruption = () => {
        setInterruptedResponse(null);
    };

    // NEW: Callback for when the camera is successfully enabled
    const handleCameraEnabled = () => {
        if (pendingVisualQuery) {
            appendToLog('SYSTEM', '[System: Camera activated. Resuming visual query...]');
            sendTranscriptToGemini(pendingVisualQuery);
            setPendingVisualQuery(null);
        }
    };
    
    // Conversation management functions
    const showConversationPopup = (content: string) => {
        setConversationContent(content);
        setIsConversationPopupOpen(true);
        
        // Clear any existing save timer
        if (conversationSaveTimer) {
            clearTimeout(conversationSaveTimer);
        }
        
        // Set new timer to auto-save after 8 seconds
        const timer = setTimeout(() => {
            saveConversationToNotepad();
            closeConversationPopup();
        }, 8000);
        
        setConversationSaveTimer(timer);
    };
    
    const closeConversationPopup = () => {
        setIsConversationPopupOpen(false);
        setConversationContent('');
        if (conversationSaveTimer) {
            clearTimeout(conversationSaveTimer);
            setConversationSaveTimer(null);
        }
    };
    
    const saveConversationToNotepad = () => {
        if (currentConversation.user || currentConversation.agent) {
            const conversationText = `**Conversation - ${new Date().toLocaleString()}**\n\n**User:** ${currentConversation.user}\n\n**Agent Lee:** ${currentConversation.agent}`;
            
            // Save to localStorage (notepad will read from here)
            const savedNotes = JSON.parse(localStorage.getItem('agentNotes') || '[]');
            savedNotes.push({
                id: `conversation-${Date.now()}`,
                type: 'conversation',
                content: conversationText,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('agentNotes', JSON.stringify(savedNotes));
            
            console.log('Conversation saved to notepad:', conversationText);
            
            // Reset conversation
            setCurrentConversation({ user: '', agent: '' });
        }
    };
    
    const styles = `
    :root { --bg-gradient: linear-gradient(135deg, #121212 0%, #000000 100%); --text-primary: #f0f0f0; --text-secondary: #D4AF37; --border-color: #D4AF37; --accent-bg: #D4AF37; --accent-text: #121212; --surface-bg: #1E1E1E; --surface-text: #E0E0E0; }
    * { box-sizing: border-box; }
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
    body.theme-onyx-gold { --bg-gradient: linear-gradient(135deg, #121212 0%, #000000 100%); --text-primary: #f0f0f0; --text-secondary: #D4AF37; --border-color: #D4AF37; --accent-bg: #D4AF37; --accent-text: #121212; }
    body.theme-midnight { --bg-gradient: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); --text-primary: #e2e8f0; --text-secondary: #63b3ed; --border-color: #4a5568; --accent-bg: #63b3ed; --accent-text: #1a202c; }
    body.theme-slate { --bg-gradient: linear-gradient(135deg, #334155 0%, #475569 100%); --text-primary: #f1f5f9; --text-secondary: #a78bfa; --border-color: #64748b; --accent-bg: #a78bfa; --accent-text: #1e293b; }
    body.theme-nebula { --bg-gradient: linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%); --text-primary: #f5f3ff; --text-secondary: #f472b6; --border-color: #7c3aed; --accent-bg: #f472b6; --accent-text: #4c1d95; }
    .leeway-multitool-wrapper { width: 100%; height: 100%; background: var(--bg-gradient); display: flex; flex-direction: row; gap: 1rem; align-items: stretch; padding: 1rem; color: var(--text-primary); font-family: 'Inter', sans-serif; overflow: hidden; }
    .left-pane { width: 30%; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; }
    .top-info-wrapper { flex-shrink: 0; }
    .app-container { flex-grow: 1; background: var(--bg-gradient); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); display: flex; flex-direction: column; min-height: 0; position: relative; }
    .app-header { text-align: center; margin-bottom: 1.5rem; }
    .app-header h1 { color: #ffffff; font-size: 2.25rem; font-weight: 600; }
    .app-header p { font-size: 1rem; color: var(--text-secondary); }
    .app-tabs-container { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .app-tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
    .app-tab-btn { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border: 3px solid transparent; border-radius: 0.75rem; cursor: pointer; transition: all 0.3s ease; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; min-height: 80px; position: relative; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); overflow: hidden; }
    .app-tab-btn.image-button { background-color: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important; }
    .app-tab-btn:hover { transform: translateY(-8px); box-shadow: 0 8px 25px rgba(255, 165, 0, 0.6), 0 0 20px rgba(255, 140, 0, 0.4); filter: brightness(1.2); border-color: rgba(255, 165, 0, 0.5); }
    .app-tab-btn.active { border-color: rgba(255, 165, 0, 0.8); transform: translateY(-8px); box-shadow: 0 8px 25px rgba(255, 165, 0, 0.8), 0 0 25px rgba(255, 140, 0, 0.6); filter: brightness(1.3); }
    .app-tab-btn svg { width: 1.75rem; height: 1.75rem; color: var(--text-secondary); transition: color 0.2s; }
    .tab-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 0.75rem;
        filter: brightness(1.3) contrast(1.2) saturate(1.1);
        transition: all 0.3s ease;
    }
    .app-tab-btn:hover .tab-image {
        filter: brightness(1.5) contrast(1.4) saturate(1.3);
        transform: scale(1.1);
    }
    .app-content-area { border-radius: 0.5rem; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
    .app-content-area:not(.no-surface) { background: var(--surface-bg); color: var(--surface-text); padding: 1.5rem; }
    .research-mode-selector { display: flex; gap: 1rem; align-items: center; padding-bottom: 1rem; }
    .research-mode-selector .research-mode-btn { 
        padding: 0; 
        background: transparent; 
        border: none; 
        border-radius: 12px; 
        color: var(--text-secondary); 
        font-weight: 500; 
        cursor: pointer; 
        transition: all 0.3s ease; 
        height: 80px;
        width: 80px; 
        position: relative; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: none;
        overflow: hidden;
    }
    .research-mode-selector .research-mode-btn:hover { 
        transform: translateY(-6px); 
        box-shadow: 0 8px 25px rgba(255, 165, 0, 0.6), 0 0 20px rgba(255, 140, 0, 0.4); 
        filter: brightness(1.3); 
        border-color: rgba(255, 165, 0, 0.5);
    }
    .research-mode-selector .research-mode-btn.active { 
        border-color: rgba(255, 165, 0, 0.9); 
        transform: translateY(-6px); 
        box-shadow: 0 8px 25px rgba(255, 165, 0, 0.8), 0 0 25px rgba(255, 140, 0, 0.6); 
        filter: brightness(1.4); 
    }
    .mode-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
        filter: brightness(1.6) contrast(1.4) saturate(1.3);
        transition: all 0.3s ease;
    }
    .research-mode-btn:hover .mode-image {
        filter: brightness(1.6) contrast(1.5) saturate(1.4);
        transform: scale(1.1);
    }
    .bottom-controls-wrapper { display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto; flex-shrink: 0; }
    .central-input-bar { display: flex; gap: 0.5rem; background: #111; padding: 0.375rem; border-radius: 0.5rem; border: 1px solid var(--border-color); flex-grow: 1; align-items: center; }
    .central-input-bar textarea { flex-grow: 1; background: #222; color: #f9fafb; border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 1rem; resize: none; min-height: 40px; }
    .central-input-bar textarea::placeholder { color: #d4af37a0; }
    .central-input-bar textarea:focus { outline: none; box-shadow: 0 0 0 2px var(--border-color); }
    .input-buttons { display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem; }
    .input-buttons.input-buttons-row { flex-direction: row; gap: 0.5rem; }
    .input-buttons button, .note-picker-btn { background: var(--accent-bg); color: var(--accent-text); border: none; border-radius: 0.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    
    /* Image button styles for each tool */
    .app-tab-btn[data-image="reasearch"] { background-image: url('/reasearch.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="text"] { background-image: url('/text.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="image"] { background-image: url('/image.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="analyze"] { background-image: url('/analyze.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="documents"] { background-image: url('/documents.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="call"] { background-image: url('/call.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="email"] { background-image: url('/email.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="notepad"] { background-image: url('/notepad.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .app-tab-btn[data-image="settings"] { background-image: url('/settings.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    
    /* Research mode button styles */
    .research-mode-btn[data-image="general"] { background-image: url('/general.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .research-mode-btn[data-image="academic"] { background-image: url('/academic.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .research-mode-btn[data-image="wiki"] { background-image: url('/wiki.png'); background-size: contain; background-repeat: no-repeat; background-position: center; }
    .input-buttons button.mic-button { background-color: #444; color: white; }
    .input-buttons button.mic-button.always-on { box-shadow: 0 0 8px 2px rgba(212, 175, 55, 0.8); }
    .input-buttons button.mic-button.listening { background-color: #d43737; animation: pulse-red 1.5s infinite; box-shadow: none; }
    
    /* Combined Mic/Send Button Styles */
    .mic-button.combined-mic-send {
        padding: 0;
        border-radius: 12px;
        border: 3px solid #d4af37;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.1);
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .mic-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
        filter: brightness(1.6) contrast(1.4) saturate(1.2) hue-rotate(-15deg) drop-shadow(0 0 15px rgba(212, 175, 55, 1)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .mic-button.combined-mic-send:hover .mic-image {
        transform: scale(1.15) translateY(-2px);
        filter: brightness(1.8) contrast(1.8) saturate(1.6) drop-shadow(0 0 20px rgba(244, 208, 63, 1)) drop-shadow(0 4px 15px rgba(212, 175, 55, 0.6));
    }
    
    .mic-button.combined-mic-send:hover {
        border-color: #f4d03f;
        box-shadow: 
            0 0 30px rgba(244, 208, 63, 0.8),
            0 0 60px rgba(244, 208, 63, 0.4),
            0 8px 25px rgba(0, 0, 0, 0.3),
            inset 0 2px 12px rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
        transform: translateY(-3px);
    }
    
    .mic-button.combined-mic-send:active {
        transform: translateY(-1px);
        box-shadow: 
            0 0 25px rgba(244, 208, 63, 0.9),
            0 4px 15px rgba(0, 0, 0, 0.4);
    }
    
    /* Logo Watermark */
    .logo-watermark {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 999;
        pointer-events: none;
        width: 120px;
        height: 120px;
        opacity: 0.6;
        filter: brightness(1.2) contrast(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 8px;
        backdrop-filter: blur(2px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .logo-watermark:hover {
        opacity: 0.8;
        transform: scale(1.05);
    }
    
    .logo-watermark img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 8px;
    }
    
    /* Conversation Popup Styles */
    .conversation-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 2px solid #d4af37;
        border-radius: 20px;
        padding: 2rem;
        max-width: 80vw;
        max-height: 70vh;
        overflow-y: auto;
        z-index: 2000;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        animation: popupSlideIn 0.3s ease-out;
    }
    
    @keyframes popupSlideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    .conversation-content {
        color: #f9fafb;
        line-height: 1.6;
        font-size: 1rem;
        white-space: pre-wrap;
        margin-bottom: 1rem;
    }
    
    .conversation-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        color: #d4af37;
        font-weight: 700;
        font-size: 1.25rem;
    }
    
    .conversation-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
    }
    
    .conversation-btn {
        background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
        color: #1a1a1a;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .conversation-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
    }
    
    .conversation-btn.secondary {
        background: transparent;
        color: #d4af37;
        border: 2px solid #d4af37;
    }
    
    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1999;
        backdrop-filter: blur(5px);
    }

    /* Floating Agent Lee Avatar */
    .floating-agent-avatar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        pointer-events: none;
    }
    
    .agent-avatar-square {
        width: 180px;
        height: 200px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 4px solid #d4af37;
        border-radius: 20px;
        padding: 0;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.3);
        backdrop-filter: blur(15px);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }
    
    .agent-lee-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 20px;
        filter: brightness(1.8) contrast(1.2) saturate(1.1) hue-rotate(10deg);
    }
    @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(212, 55, 55, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(212, 55, 55, 0); } 100% { box-shadow: 0 0 0 0 rgba(212, 55, 55, 0); } }
    .input-buttons button:hover, .note-picker-btn:hover { background: #b8860b; }
    .input-buttons button:disabled { background: #555; cursor: not-allowed; }
    .ai-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .ai-modal-content { background: var(--surface-bg); color: var(--surface-text); border-radius: 10px; padding: 2rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; border: 2px solid var(--border-color); }
    .ai-modal-content h2 { color: var(--text-secondary); }
    .ai-modal-content button { background: var(--accent-bg); color: var(--accent-text); }
    .note-picker-container { position: relative; }
    .note-picker-dropdown { position: absolute; bottom: 110%; right: 0; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); width: 300px; max-height: 400px; overflow-y: auto; z-index: 20; border: 1px solid #ccc; }
    .note-picker-dropdown button { display: block; width: 100%; text-align: left; padding: 12px 15px; background: none; border: none; border-bottom: 1px solid #eee; cursor: pointer; }
    .note-picker-dropdown button:hover { background: #f5f5f5; }
    .note-picker-dropdown button:last-child { border-bottom: none; }
    .interruption-banner { background-color: #fff3cd; color: #664d03; border: 1px solid #ffecb5; padding: 0.75rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; margin: -0.5rem 0 0.5rem 0; }
    .interruption-banner button { background: #ffc107; border: none; color: #000; padding: 0.25rem 0.75rem; border-radius: 0.375rem; cursor: pointer; margin-left: 0.5rem; font-weight: 600; }
    .interruption-banner button.dismiss { background: #6c757d; color: #fff; }
    .character-selector-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; }
    .character-selector-container label { font-weight: 500; color: var(--text-secondary); }
    .character-selector-container select { background: #333; color: #fff; border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.25rem 0.5rem; }
    
    /* --- Responsive Design for Mobile & Tablet --- */
    @media (max-width: 960px) {
        html, body, #root {
            height: auto;
            overflow: auto;
        }
        .leeway-multitool-wrapper {
            flex-direction: column;
            height: auto;
            min-height: 100dvh;
            gap: 0.25rem;
            padding: 0.25rem;
            padding-top: env(safe-area-inset-top, 0.25rem);
            padding-left: env(safe-area-inset-left, 0.25rem);
            padding-right: env(safe-area-inset-right, 0.25rem);
            padding-bottom: 120px; /* Reduced space for fixed input bar */
        }
        
        .left-pane {
            width: 100%;
            min-height: 0;
            flex-shrink: 1;
            gap: 0.25rem; /* Reduced gap between elements */
        }
        
        .app-container {
            width: 100%;
            min-height: 0;
            flex-shrink: 1;
            padding: 0.75rem; /* Reduced padding */
            margin-top: 0.25rem; /* Minimal top margin */
        }
        
        .app-header {
            margin-bottom: 0.75rem; /* Reduced margin */
        }
        .app-header h1 {
            font-size: 1.25rem; /* Smaller font for mobile */
        }
        .app-header p {
            font-size: 0.75rem;
        }

        .app-content-area:not(.no-surface) {
            padding: 0.75rem;
        }
        
        /* Compact camera feed for mobile */
        #camera-feed-container {
            max-height: 200px;
            overflow: hidden;
        }
        
        /* Compact avatar for mobile */
        .floating-agent-avatar {
            max-height: 100px;
        }
        
        /* Compact logo for mobile */
        .logo-watermark {
            max-height: 40px;
        }
        
        /* Tighter tab layout for mobile */
        .app-tabs {
            gap: 0.5rem;
            padding-bottom: 0.5rem;
        }
        
        .app-tab-btn {
            min-height: 60px; /* Smaller tabs for mobile */
        }

        .research-mode-selector {
            flex-wrap: nowrap;
            padding-bottom: 0.5rem;
            gap: 0.5rem;
        }
        
        .research-mode-selector .research-mode-btn {
            padding: 0.5rem 0.25rem;
            font-size: 0.8rem;
            flex: 1;
            white-space: nowrap;
            min-height: 50px;
        }
        
        .bottom-controls-wrapper {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10;
            background: #000;
            padding: 0.75rem;
            padding-left: calc(0.75rem + env(safe-area-inset-left, 0rem));
            padding-right: calc(0.75rem + env(safe-area-inset-right, 0rem));
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0rem));
            border-top: 1px solid var(--border-color);
            box-shadow: 0 -4px 12px rgba(0,0,0,0.25);
        }

        .central-input-bar textarea {
            min-height: 38px;
        }

        .input-buttons button, .note-picker-btn {
            width: 38px;
            height: 38px;
        }
    }

    @media (max-width: 480px) {
        .app-header h1 {
            font-size: 1.25rem;
        }
        .app-container {
            padding: 0.75rem;
        }
        .app-content-area:not(.no-surface) {
            padding: 0.75rem;
        }
    }
    `;
    
    const CharacterSelector = () => {
        if (characters.length === 0) return null;

        return (
            <div className="character-selector-container">
                <label htmlFor="character-select">Active Character:</label>
                <select 
                    id="character-select" 
                    value={imageStudioState.selectedCharacterId ?? ''} 
                    onChange={e => setImageStudioState(prev => ({...prev, selectedCharacterId: e.target.value ? Number(e.target.value) : null}))}
                >
                    <option value="">None</option>
                    {characters.map(char => (
                        <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                </select>
            </div>
        );
    };

    const renderFeature = () => {
        switch (activeFeature) {
          case 'text':
            return <TextGenerator result={results.text} loading={loading} error={error} systemInstruction={systemInstruction} setSystemInstruction={setSystemInstruction} />;
          case 'image':
            return <ImageStudio 
                        imageResults={results.images} 
                        loading={loading} 
                        error={error} 
                        studioState={imageStudioState}
                        setStudioState={setImageStudioState}
                    />;
          case 'analyze':
            return <MediaAnalyzer result={results.analyze} loading={loading} error={error} file={mediaFile} setFile={setMediaFile} onStartNew={() => setActiveFeature('analyze')} />;
          case 'audio':
            return <AudioAnalyzer result={results.audio} loading={loading} error={error} file={audioFile} setFile={setAudioFile} onStartNew={() => setActiveFeature('audio')} />;
          case 'research':
            return <Researcher result={results.research} loading={loading} error={error} setBrowserUrl={setBrowserUrl} />;
          case 'document':
            return <DocumentAnalyzer result={results.document} loading={loading} error={error} file={documentFile} setFile={setDocumentFile} onStartNew={() => setActiveFeature('document')} />;
          case 'call':
            return <CommunicationControl userName={userName || 'the operator'} numberToCall={numberToCall} />;
          case 'email':
            return <EmailClient />;
          case 'notepad':
            return <AgentNotepad applyNoteToPrompt={applyNoteToPrompt} />;
          case 'settings':
            return <Settings transmissionLog={agentTransmissionLog} userName={userName || null} />;
          // FIX: Changed 'case "default"' to 'default' to correctly handle the switch statement's default case.
          default:
            return <p>Select a feature.</p>;
        }
    };
    
    const isPromptEmpty = !promptInput.trim();
    const isSubmitDisabled = loading || isPromptEmpty;

    const handleOnboardingComplete = useCallback(() => {
        setIsOnboardingComplete(true);
        localStorage.setItem('onboardingComplete', 'true');
    }, []);

    const handleNameSet = (name: string) => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        setUserName(capitalizedName);
        localStorage.setItem('userName', capitalizedName);
    };
    //#endregion

    //#region Render
    return (
        <React.Fragment>
            {!isOnboardingComplete && (
                <OnboardingGuide
                    onComplete={handleOnboardingComplete}
                    onTabClick={handleTabClick}
                    onNameSet={handleNameSet}
                />
            )}
            {browserUrl && <InAppBrowser url={browserUrl} onClose={() => setBrowserUrl(null)} />}
            <div className="leeway-multitool-wrapper">
                <style>{styles}</style>
                
                <div className="left-pane">
                    <div className="logo-watermark">
                        <img src="/logo.png" alt="Logo" />
                    </div>
                    <div className="floating-agent-avatar" id="agent-avatar-container">
                        <div className="agent-avatar-square">
                            <img src="/Agent-Lee-Avatar.png" alt="Agent Lee" className="agent-lee-image" />
                        </div>
                    </div>
                    {interruptedResponse && (
                        <div className="interruption-banner">
                            <span>Agent Lee was interrupted.</span>
                            <div>
                                <button onClick={handleResumeInterruption}>Resume</button>
                                <button onClick={handleDismissInterruption} className="dismiss">Dismiss</button>
                            </div>
                        </div>
                    )}
                    <div id="camera-feed-container">
                        <CameraFeed ref={cameraFeedRef} onCameraEnabled={handleCameraEnabled} />
                    </div>
                    <div className="bottom-controls-wrapper">
                        <PersistentActions activeFeature={activeFeature} resultData={currentResultData} onAiAnalyze={handleGlobalAiAnalysis} />
                        <div className="central-input-bar" id="central-input-bar">
                            <div className="note-picker-container">
                                <button onClick={() => setIsNotePickerOpen(p => !p)} className="note-picker-btn" title="Use content from a note">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
                                </button>
                                {isNotePickerOpen && (
                                    <div className="note-picker-dropdown">
                                        {notes.length > 0 ? notes.map(note => (
                                            <button key={note.id} onClick={() => applyNoteToPrompt(note)}>
                                                {note.title}
                                            </button>
                                        )) : <p className="p-4 text-sm text-center">No notes available.</p>}
                                    </div>
                                )}
                            </div>
                            <textarea
                                id="central-prompt-input"
                                value={promptInput}
                                onChange={(e) => setPromptInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(promptInput); } }}
                                placeholder={isAlwaysListening ? "Listening..." : placeholderText}
                                aria-label="Central prompt input"
                                rows={1}
                                disabled={!isOnboardingComplete}
                            />
                            <div className="input-buttons input-buttons-row">
                               <button 
                                   id="mic-button"
                                   onClick={() => {
                                       if (promptInput.trim() && !isAlwaysListening) {
                                           handleSubmit(promptInput);
                                       } else {
                                           handleMicToggle();
                                       }
                                   }}
                                   className={`mic-button combined-mic-send ${isAlwaysListening ? 'always-on' : ''} ${isListening ? 'listening' : ''}`}
                                   title={promptInput.trim() && !isAlwaysListening ? "Send message" : (isAlwaysListening ? "Always-on mode is active. Click to disable." : "Click to enable always-on mode.")}
                                   disabled={!isOnboardingComplete}
                               >
                                 <img src="/Mac-Million-Mic.png" alt="Macmillan Microphone" className="mic-image" />
                               </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="app-container" id="app-container">
                    <header className="app-header">
                        <h1>Agent Lee Multi-Tool</h1>
                        <p>Classified Intelligence Hub</p>
                    </header>

                    <div className="app-tabs-container" id="app-tabs-container">
                        <div className="app-tabs" role="tablist" aria-label="Main features">
                            {tabs.map(tab => {
                                const isSelected = activeFeature === tab.id;
                                return (
                                <button 
                                    key={tab.id} 
                                    onClick={() => handleTabClick(tab.id)} 
                                    className={`app-tab-btn image-button ${isSelected ? 'active' : ''}`}
                                    role="tab"
                                    aria-controls={`feature-panel-${tab.id}`}
                                    id={`feature-tab-${tab.id}`}
                                    title={tab.label}
                                    {...(isSelected && { 'aria-selected': 'true' })}
                                >
                                    <img src={tab.imagePath} alt={tab.label} className="tab-image" />
                                </button>
                                );
                            })}
                        </div>
                        {activeFeature === 'research' && (
                           <div className="research-mode-selector">
                               {researchModes.map(({ id, label, imagePath }) => (
                                   <button 
                                       key={id} 
                                       onClick={() => setResearchMode(id)} 
                                       className={`research-mode-btn image-button ${researchMode === id ? 'active' : ''}`}
                                       title={label}
                                   >
                                       <img src={imagePath} alt={label} className="mode-image" />
                                   </button>
                               ))}
                           </div>
                        )}
                    </div>
                    
                    {activeFeature === 'text' && <CharacterSelector />}

                    <main 
                        id={`feature-panel-${activeFeature}`}
                        role="tabpanel"
                        // FIX: Changed tab.id to activeFeature, which is in scope and represents the active tab.
                        aria-labelledby={`feature-tab-${activeFeature}`}
                        className={`app-content-area ${['notepad', 'call', 'email', 'settings', 'image'].includes(activeFeature) ? 'no-surface' : ''}`}>
                         <Suspense fallback={<LoadingSpinner message={`Loading ${activeFeature} module...`} />}>
                            {renderFeature()}
                        </Suspense>
                    </main>
                </div>
            
            {/* Modals and overlays */}
            {isAnalysisModalOpen && (
                <div className="ai-modal-backdrop" onClick={() => setIsAnalysisModalOpen(false)}>
                    <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">AI Note Analysis</h2>
                        {isAnalysisLoading ? <LoadingSpinner message="Analyzing..." /> : 
                            <div className="prose max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: markdownToHtml(analysisModalContent) }}></div>
                        }
                        <button onClick={() => setIsAnalysisModalOpen(false)} className="mt-6 text-white px-4 py-2 rounded-md float-right">Close</button>
                    </div>
                </div>
            )}
                 
            
            {/* Conversation Popup */}
            {isConversationPopupOpen && (
                <>
                    <div className="popup-overlay" onClick={closeConversationPopup} />
                    <div className="conversation-popup">
                        <div className="conversation-header">
                            🤖 Agent Lee
                        </div>
                        <div className="conversation-content">
                            {conversationContent}
                        </div>
                        <div className="conversation-actions">
                            <button 
                                className="conversation-btn secondary"
                                onClick={saveConversationToNotepad}
                            >
                                Save to Notes
                            </button>
                            <button 
                                className="conversation-btn"
                                onClick={closeConversationPopup}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
            </div>
        </React.Fragment>
    );
};
//#endregion
    
const App: React.FC = () => {
    return (
        <NotepadProvider>
            <CharacterProvider>
                <AppContent />
            </CharacterProvider>
        </NotepadProvider>
    )
};

export default App;