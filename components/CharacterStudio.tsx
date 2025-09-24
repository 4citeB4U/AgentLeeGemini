/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_CHARACTER_STUDIO
COLOR_ONION_HEX: NEON=#F59E0B FLUO=#D97706 PASTEL=#FEF3C7
ICON_FAMILY: lucide
ICON_GLYPH: palette
ICON_SIG: AL002017
5WH: WHAT=Character creation and customization studio; WHY=Persona development and agent personality design; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\CharacterStudio.tsx; WHEN=2025-09-22; HOW=React component with character editing tools
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
import React, { useContext, useState, useEffect, useRef } from 'react';
import { CharacterContext } from '../contexts/CharacterContext';
import type { Character } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
//#endregion

//#region Init
interface CharacterStudioProps {
    selectedCharacterId: number | null;
    onSelectCharacter: (id: number | null) => void;
}

const CharacterStudio: React.FC<CharacterStudioProps> = ({ selectedCharacterId, onSelectCharacter }) => {
    const { characters, addCharacter, updateCharacter, deleteCharacter } = useContext(CharacterContext);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [appearance, setAppearance] = useState('');
    const [personality, setPersonality] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
    const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
    const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
    const [characterTemplate, setCharacterTemplate] = useState('');
    const [usageCount, setUsageCount] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

    useEffect(() => {
        if (selectedCharacter && !isCreatingNew) {
            setName(selectedCharacter.name);
            setAppearance(selectedCharacter.appearance);
            setPersonality(selectedCharacter.personality);
            setAvatarUrl(selectedCharacter.avatarUrl);
        } else {
            resetForm();
        }
    }, [selectedCharacter, isCreatingNew]);

    const resetForm = () => {
        setName('');
        setAppearance('');
        setPersonality('');
        setAvatarUrl(undefined);
    };

    const handleSelectCharacter = (character: Character) => {
        setIsCreatingNew(false);
        onSelectCharacter(character.id);
    };

    const handleNewCharacter = () => {
        onSelectCharacter(null);
        setIsCreatingNew(true);
        resetForm();
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Character name is required.');
            return;
        }

        if (isCreatingNew) {
            const newChar = addCharacter({ name, appearance, personality, avatarUrl });
            onSelectCharacter(newChar.id);
            setIsCreatingNew(false);
        } else if (selectedCharacter) {
            updateCharacter({
                ...selectedCharacter,
                name,
                appearance,
                personality,
                avatarUrl,
            });
        }
    };

    const handleDelete = () => {
        if (selectedCharacter) {
            deleteCharacter(selectedCharacter.id);
            onSelectCharacter(null);
            setIsCreatingNew(false);
        }
    };
    
    const generateCharacterTemplate = async () => {
        if (!name.trim() || !appearance.trim()) {
            alert('Please provide character name and appearance description first.');
            return;
        }
        
        setIsGeneratingTemplate(true);
        try {
            const templatePrompt = `Create a detailed, consistent character template for image generation based on this profile:

Name: ${name}
Appearance: ${appearance}
Personality: ${personality}

Generate a comprehensive character template that includes:
1. Detailed physical description (height, build, facial features, hair, eyes, skin tone)
2. Typical clothing/style preferences
3. Distinctive features or characteristics
4. Pose and expression guidelines
5. Consistent visual keywords for AI image generation

Format as a professional character sheet that can be reused across multiple image generations for consistency.`;
            
            const response = await geminiService.generateText(templatePrompt);
            const template = response || '';
            setCharacterTemplate(template);
            
            // Calculate consistency score based on detail level
            const score = Math.min(100, Math.floor(
                (appearance.length * 0.3) + 
                (personality.length * 0.2) + 
                (template.length * 0.5)
            ));
            setConsistencyScore(score);
            
        } catch (error) {
            console.error('Error generating character template:', error);
            alert('Failed to generate character template. Please try again.');
        } finally {
            setIsGeneratingTemplate(false);
        }
    };
    
    const copyTemplateToClipboard = () => {
        if (characterTemplate) {
            navigator.clipboard.writeText(characterTemplate);
            alert('Character template copied to clipboard!');
        }
    };
    
    const trackCharacterUsage = () => {
        if (selectedCharacter) {
            const usageData = JSON.parse(localStorage.getItem('character-usage') || '{}');
            const currentCount = usageData[selectedCharacter.id] || 0;
            usageData[selectedCharacter.id] = currentCount + 1;
            localStorage.setItem('character-usage', JSON.stringify(usageData));
            setUsageCount(currentCount + 1);
        }
    };
    
    const handleGenerateAvatar = async () => {
        if (!appearance.trim()) {
            alert('Please provide an appearance description to generate an avatar.');
            return;
        }
        setIsGeneratingAvatar(true);
        try {
            const prompt = `${appearance}, character portrait, digital art, high detail, headshot`;
            const imageUrl = await geminiService.generateImage(prompt);
            setAvatarUrl(imageUrl);

             if (selectedCharacter && !isCreatingNew) {
                updateCharacter({ ...selectedCharacter, name, appearance, personality, avatarUrl: imageUrl });
             }
        } catch (error) {
            console.error("Avatar generation failed:", error);
            alert(`Failed to generate avatar: ${(error as Error).message}`);
        } finally {
            setIsGeneratingAvatar(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeProfile = async () => {
        if (!avatarUrl) {
            alert("Please upload an avatar image first.");
            return;
        }

        setIsAnalyzingProfile(true);
        try {
            const [header, base64Data] = avatarUrl.split(',');
            if (!header || !base64Data) throw new Error("Invalid image data URL.");
        
            const mimeTypeMatch = /:(.*?);/.exec(header);
            if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error("Could not determine MIME type from data URL.");
        
            const mimeType = mimeTypeMatch[1];
            
            const profile = await geminiService.generateCharacterProfileFromImage(base64Data, mimeType);

            setAppearance(profile.appearance);
            setPersonality(profile.personality);

        } catch (error) {
            console.error("Character profile analysis failed:", error);
            alert(`Failed to analyze profile: ${(error as Error).message}`);
        } finally {
            setIsAnalyzingProfile(false);
        }
    };
    
    const handleExport = () => {
        if (!selectedCharacter) return;
        const jsonString = JSON.stringify(selectedCharacter, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCharacter.name.replace(/ /g, '_')}_character.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedChar = JSON.parse(e.target?.result as string);
                if (importedChar.name && importedChar.appearance && importedChar.personality) {
                    addCharacter({
                        name: importedChar.name,
                        appearance: importedChar.appearance,
                        personality: importedChar.personality,
                        avatarUrl: importedChar.avatarUrl,
                    });
                    alert(`Character "${importedChar.name}" imported successfully.`);
                } else {
                    alert('Invalid character file format.');
                }
            } catch (error) {
                alert('Error reading or parsing the character file.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full bg-black/20 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <h3 className="text-lg font-bold text-gray-100">Character Roster</h3>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImport} 
                        accept=".json" 
                        className="hidden" 
                        aria-label="Import character from JSON file"
                        title="Import character from JSON file"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="action-btn-sm" title="Import Character"><i className="fas fa-upload"></i></button>
                    <button onClick={handleExport} disabled={!selectedCharacter} className="action-btn-sm" title="Export Selected Character"><i className="fas fa-download"></i></button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto my-3 space-y-2 pr-2">
                {characters.map(char => (
                    <div key={char.id} onClick={() => handleSelectCharacter(char)} className={`character-list-item ${selectedCharacter?.id === char.id ? 'selected' : ''}`}>
                        <img src={char.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(char.name)}&background=2a2a2a&color=d4af37`} alt={char.name} className="char-item-avatar" />
                        <span className="char-item-name">{char.name}</span>
                        {selectedCharacter?.id === char.id && <i className="fas fa-check-circle text-green-400 ml-auto"></i>}
                    </div>
                ))}
            </div>

            <button onClick={handleNewCharacter} className="action-btn btn-primary w-full justify-center">Create New Character</button>
            
            {(selectedCharacter || isCreatingNew) && (
                <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center" onClick={() => { setIsCreatingNew(false); onSelectCharacter(selectedCharacter?.id || null); }}>
                    <div className="bg-gray-800 text-gray-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 border border-gray-600" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">{isCreatingNew ? 'Create New Character' : `Edit ${selectedCharacter?.name}`}</h2>
                        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                            <div className="flex gap-4">
                                {isGeneratingAvatar || isAnalyzingProfile ? (
                                    <div className="avatar-preview flex items-center justify-center flex-shrink-0"><LoadingSpinner message={isAnalyzingProfile ? 'Analyzing...' : 'Generating...'} /></div>
                                ) : (
                                    <img src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=333&color=fff&size=100`} alt="Avatar Preview" className="avatar-preview flex-shrink-0" />
                                )}
                                <div className="flex flex-col gap-2">
                                    <label>Avatar Actions</label>
                                    <div className="flex gap-2 flex-wrap">
                                        <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                        <label htmlFor="avatar-upload" className="action-btn btn-secondary text-sm cursor-pointer"><i className="fas fa-upload mr-1"></i> Upload</label>
                                        <button onClick={handleAnalyzeProfile} disabled={isAnalyzingProfile || isGeneratingAvatar || !avatarUrl} className="action-btn btn-secondary text-sm"><i className="fas fa-magic mr-1"></i> Analyze</button>
                                        <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar || isAnalyzingProfile || !appearance} className="action-btn btn-secondary text-sm"><i className="fas fa-robot mr-1"></i> Generate</button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group"><label htmlFor="char-name">Name</label><input id="char-name" type="text" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div className="form-group"><label htmlFor="char-appearance">Appearance</label><textarea id="char-appearance" value={appearance} onChange={e => setAppearance(e.target.value)} placeholder="e.g., A tall woman with short, silver hair..." rows={4}/></div>
                            <div className="form-group"><label htmlFor="char-personality">Personality</label><textarea id="char-personality" value={personality} onChange={e => setPersonality(e.target.value)} placeholder="e.g., Stoic, calculating, former special agent..." rows={4}/></div>
                            
                            {/* Character Consistency System */}
                            <div className="bg-gray-900/60 border border-gray-600 rounded-lg p-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-yellow-400">🎯 Consistency System</h4>
                                    {consistencyScore !== null && (
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold text-center min-w-[80px] ${
                                            consistencyScore >= 80 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500' 
                                                : consistencyScore >= 60 
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                                                : 'bg-red-500/20 text-red-400 border border-red-500'
                                        }`}>
                                            Score: {consistencyScore}%
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={generateCharacterTemplate} 
                                        disabled={isGeneratingTemplate || !name.trim() || !appearance.trim()}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        {isGeneratingTemplate ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
                                        ) : (
                                            <><i className="fas fa-clipboard-list mr-2"></i>Generate Template</>
                                        )}
                                    </button>
                                    {characterTemplate && (
                                        <button 
                                            onClick={copyTemplateToClipboard}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                            title="Copy template to clipboard"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    )}
                                </div>
                                
                                {selectedCharacter && (
                                    <div className="flex gap-4 mb-4 p-3 bg-black/30 rounded-lg">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Usage Count</span>
                                            <span className="text-sm text-gray-100 font-medium">{usageCount} generations</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Created</span>
                                            <span className="text-sm text-gray-100 font-medium">{new Date(selectedCharacter.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {characterTemplate && (
                                    <div className="mt-3">
                                        <label className="text-sm font-medium text-gray-300 mb-2 block">Character Template:</label>
                                        <div className="bg-black/40 border border-gray-600 rounded-lg p-3 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {characterTemplate}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-4">
                            <div>{selectedCharacter && !isCreatingNew && <button onClick={handleDelete} className="action-btn btn-danger">Delete</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsCreatingNew(false); onSelectCharacter(selectedCharacter?.id || null); }} className="action-btn btn-secondary">Cancel</button>
                                <button onClick={handleSave} className="action-btn btn-primary">{isCreatingNew ? 'Create Character' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterStudio;
