/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_INTERACTIVE_ONBOARDING
COLOR_ONION_HEX: NEON=#22D3EE FLUO=#06B6D4 PASTEL=#CFFAFE
ICON_FAMILY: lucide
ICON_GLYPH: play-circle
ICON_SIG: AL003001
5WH: WHAT=Interactive onboarding component; WHY=Guided user introduction and feature walkthrough; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\src\components\InteractiveOnboarding.tsx; WHEN=2025-09-22; HOW=React component with step-based tutorials
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
import React, { useState, useEffect, useRef } from 'react';
import Spotlight from '../../components/Spotlight';
import { onboardingScript } from '../onboarding-script';
import * as ttsService from '../../services/ttsService';
import { finalizeSpokenOutput } from '../prompts';
import type { Feature } from '../../types';

interface InteractiveOnboardingProps {
    onComplete: () => void;
    onTabClick: (feature: Feature) => void;
    onNameSet: (name: string) => void;
}
//#endregion

//#region Init
const InteractiveOnboarding: React.FC<InteractiveOnboardingProps> = ({ onComplete, onTabClick, onNameSet }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [message, setMessage] = useState('');
    const [isAwaitingInput, setIsAwaitingInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [currentPlaceholder, setCurrentPlaceholder] = useState('');
    const [messageBoxPosition, setMessageBoxPosition] = useState<'top' | 'bottom' | 'center'>('center');
    const [isReadyToStart, setIsReadyToStart] = useState(false);
    
    const tourCancelled = useRef(false);
    const inputPromiseResolver = useRef<((value: string) => void) | null>(null);

    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const onTabClickRef = useRef(onTabClick);
    onTabClickRef.current = onTabClick;
    const onNameSetRef = useRef(onNameSet);
    onNameSetRef.current = onNameSet;
//#endregion

//#region Effects & Internals

    useEffect(() => {
        if (!isReadyToStart) return;

        ttsService.initTts();
        let tourUserName = '';

        const runTour = async () => {
            for (let i = 0; i < onboardingScript.length; i++) {
                if (tourCancelled.current) break;

                const step = onboardingScript[i];
                const textToSpeak = step.text.replace('{userName}', tourUserName);

                const scrollTargetId = step.scrollToId || step.targetId;
                if (scrollTargetId) {
                    const element = document.getElementById(scrollTargetId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await new Promise(resolve => setTimeout(resolve, 400));
                    }
                }
                if (tourCancelled.current) break;
                
                if (step.targetId) {
                    const rect = document.getElementById(step.targetId)?.getBoundingClientRect() ?? null;
                    setTargetRect(rect);
                    if (rect) {
                        const viewportHeight = window.innerHeight;
                        // Position box at top if target is in bottom half, else bottom
                        if (rect.top > viewportHeight / 2) {
                            setMessageBoxPosition('top');
                        } else {
                            setMessageBoxPosition('bottom');
                        }
                    } else {
                        setMessageBoxPosition('center');
                    }
                } else {
                    setTargetRect(null);
                    setMessageBoxPosition('center');
                }


                if (step.action) {
                    if (step.action.type === 'click' && step.action.targetId) {
                        (document.getElementById(step.action.targetId) as HTMLElement)?.click();
                    } else if (step.action.type === 'clickFeature' && step.action.feature) {
                        onTabClickRef.current(step.action.feature);
                    }
                }
                
                setMessage(textToSpeak);
                
                await new Promise<void>(resolve => {
                    ttsService.speak(finalizeSpokenOutput(textToSpeak), () => {}, () => { if (!tourCancelled.current) resolve() })
                        .catch(error => {
                            if (!tourCancelled.current) {
                                console.error("Onboarding speech failed:", error);
                                resolve();
                            }
                        });
                });
                if (tourCancelled.current) break;

                if (step.requiresInput) {
                    setIsAwaitingInput(true);
                    setCurrentPlaceholder(step.inputPlaceholder || '');
                    const enteredName = await new Promise<string>(resolve => {
                        inputPromiseResolver.current = resolve;
                    });
                    tourUserName = enteredName;
                }

                if (step.delayAfterSpeak) {
                    await new Promise(resolve => setTimeout(resolve, step.delayAfterSpeak));
                }
            }

            if (!tourCancelled.current) {
                setTargetRect(null);
                setMessage('');
                onCompleteRef.current();
            }
        };

        const startTimeout = setTimeout(runTour, 500);

        return () => {
            tourCancelled.current = true;
            clearTimeout(startTimeout);
            ttsService.cancel();
        };
    }, [isReadyToStart]);
    
    const handleSkipTour = () => {
        if (tourCancelled.current) return;
        tourCancelled.current = true;
        ttsService.cancel();
        onCompleteRef.current();
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = inputValue.trim();
        if (name && inputPromiseResolver.current) {
            onNameSetRef.current(name);
            inputPromiseResolver.current(name);
            setIsAwaitingInput(false);
            setInputValue('');
        }
    };
//#endregion

//#region Render

    const styles = `
        .tour-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9997;
            transition: opacity 0.3s ease;
        }
        .tour-message-box {
            position: fixed;
            width: 90%;
            max-width: 500px;
            background: var(--bg-gradient);
            color: var(--text-primary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s ease;
        }
        .tour-message-box.position-center {
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
        }
        .tour-message-box.position-top {
             top: 30px;
             left: 50%;
             transform: translateX(-50%);
        }
        .tour-message-box.position-bottom {
             bottom: 30px;
             top: auto;
             left: 50%;
             transform: translateX(-50%);
        }
        .tour-message-box p {
            margin: 0;
            line-height: 1.6;
            font-size: 1.1rem;
        }
         .tour-message-box strong {
            color: var(--text-secondary);
        }
        .tour-input-form {
            margin-top: 1rem;
            display: flex;
            gap: 0.5rem;
        }
        .tour-input-field {
            flex-grow: 1;
            background-color: rgba(0,0,0,0.3);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            padding: 0.75rem;
            font-size: 1rem;
        }
        .tour-input-field::placeholder {
            color: rgba(212, 175, 55, 0.6);
        }
        .tour-input-submit {
            padding: 0.75rem 1.25rem;
            background: var(--accent-bg);
            color: var(--accent-text);
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .tour-input-submit:hover {
            background-color: #b8860b;
        }
        .skip-tour-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 0.75rem 1.5rem;
            background: var(--accent-bg);
            color: var(--accent-text);
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
        }
        .skip-tour-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        .tour-start-modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-family: 'Inter', sans-serif;
        }
        .tour-start-content {
            background: var(--bg-gradient);
            color: var(--text-primary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 2rem 3rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            max-width: 500px;
        }
        .tour-start-content h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 1rem;
        }
        .tour-start-content p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: var(--text-primary);
            margin-bottom: 2rem;
        }
        .tour-start-btn {
            padding: 0.75rem 2rem;
            background: var(--accent-bg);
            color: var(--accent-text);
            border: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .tour-start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="tour-backdrop"></div>
            
            {!isReadyToStart ? (
                <div className="tour-start-modal">
                    <div className="tour-start-content">
                        <h1>Welcome, Operator</h1>
                        <p>Agent Lee is ready for deployment. Your enhanced intelligence multi-tool is online. Begin the mandatory operational briefing?</p>
                        <button onClick={() => setIsReadyToStart(true)} className="tour-start-btn">Begin Briefing</button>
                    </div>
                </div>
            ) : (
                <>
                    <button className="skip-tour-btn" onClick={handleSkipTour}>Skip Tour</button>
                    <Spotlight targetRect={targetRect} isActive={true} />
                    {message && (
                        <div className={`tour-message-box position-${messageBoxPosition}`}>
                            <p>{message}</p>
                            {isAwaitingInput && (
                                <form onSubmit={handleInputSubmit} className="tour-input-form">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={currentPlaceholder}
                                        className="tour-input-field"
                                        autoFocus
                                        required
                                    />
                                    <button type="submit" className="tour-input-submit">Submit</button>
                                </form>
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default InteractiveOnboarding;
//#endregion