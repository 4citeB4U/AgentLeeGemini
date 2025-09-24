/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_IMAGE_STUDIO
COLOR_ONION_HEX: NEON=#A855F7 FLUO=#9333EA PASTEL=#E9D5FF
ICON_FAMILY: lucide
ICON_GLYPH: paintbrush
ICON_SIG: AL002018
5WH: WHAT=Image editing and visual content studio; WHY=Visual creativity and image manipulation tools; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\ImageStudio.tsx; WHEN=2025-09-22; HOW=React component with image editing capabilities
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React from 'react';
import CharacterStudio from './CharacterStudio';
import ImageGenerator from './ImageGenerator';
import type { GenOut } from '../src/engines/engine.types';
import type { Character } from '../types';

type ImageStudioState = {
    mode: 'text-to-image' | 'image-edit';
    baseImage: { dataUrl: string; mimeType: string; name: string } | null;
    selectedCharacterId: number | null;
};

interface ImageStudioProps {
  imageResults: GenOut[];
  loading: boolean;
  error: string;
  studioState: ImageStudioState;
  setStudioState: React.Dispatch<React.SetStateAction<ImageStudioState>>;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ imageResults, loading, error, studioState, setStudioState }) => {
  const [activeTab, setActiveTab] = React.useState<'characters' | 'edit'>('characters');
  const [isDragging, setIsDragging] = React.useState(false);

  const handleModeChange = (mode: 'text-to-image' | 'image-edit') => {
    setStudioState(prev => ({ ...prev, mode }));
  };
  
  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const mimeType = file.type;
        setStudioState(prev => ({...prev, baseImage: { dataUrl, mimeType, name: file.name }}));
        setActiveTab('edit'); // Switch to the edit tab to show the uploaded image
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const styles = `
    .image-studio-container { display: grid; grid-template-columns: 400px 1fr; gap: 1.5rem; height: 100%; overflow: hidden; }
    .studio-assets-pane { display: flex; flex-direction: column; background: #1E1E1E; border-radius: 1rem; padding: 1.5rem; border: 1px solid var(--border-color); }
    .studio-workspace-pane { display: flex; flex-direction: column; background: var(--surface-bg); border-radius: 1rem; padding: 1.5rem; border: 1px solid var(--border-color); }
    .assets-tabs { display: flex; border-bottom: 1px solid #444; margin-bottom: 1rem; }
    .assets-tab-btn { padding: 0.5rem 1rem; border: none; background: transparent; color: #aaa; font-weight: 600; cursor: pointer; position: relative; }
    .assets-tab-btn.active { color: var(--text-secondary); }
    .assets-tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--text-secondary); }
    .assets-content { flex-grow: 1; min-height: 0; }
    .mode-selector { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
    .mode-btn { padding: 0.5rem 1.5rem; border-radius: 99px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 2px solid #555; background: #333; color: #ccc; }
    .mode-btn.active { background: var(--accent-bg); color: var(--accent-text); border-color: var(--border-color); }
    .mode-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .image-drop-zone { border: 2px dashed #555; border-radius: 0.5rem; padding: 2rem; text-align: center; color: #888; transition: border-color 0.2s; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .image-drop-zone.dragging { border-color: var(--accent-bg); }
    .base-image-preview { position: relative; }
    .base-image-preview img { max-width: 100%; max-height: 200px; border-radius: 0.5rem; }
    .remove-base-img-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
    
    /* CharacterStudio specific overrides */
    .character-list-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s; border: 1px solid transparent; }
    .character-list-item:hover { background-color: rgba(255,255,255,0.05); }
    .character-list-item.selected { background-color: var(--accent-bg); color: var(--accent-text); border-color: var(--border-color); }
    .char-item-avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #444; object-fit: cover; flex-shrink: 0; }
    .char-item-name { font-weight: 600; }
    .action-btn { padding: 0.6rem 1rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .action-btn-sm { padding: 0.4rem 0.6rem; border-radius: 0.375rem; background-color: #495057; color: white; border:none; cursor:pointer; }
    .action-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background-color: var(--accent-bg); color: var(--accent-text); }
    .btn-secondary { background-color: #495057; color: white; }
    .btn-danger { background-color: #dc3545; color: white; }
    .avatar-preview { width: 100px; height: 100px; border-radius: 0.5rem; background: #333; object-fit: cover; border: 1px solid #555; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { font-weight: 600; margin-bottom: 0.5rem; display: block; }
    .form-group input, .form-group textarea { width: 100%; background: #333; color: #fff; border: 1px solid #555; border-radius: 0.5rem; padding: 0.75rem; }
    
    @media (max-width: 1200px) {
        .image-studio-container { grid-template-columns: 320px 1fr; }
    }
    @media (max-width: 960px) {
        .image-studio-container { display: flex; flex-direction: column; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="image-studio-container">
        <div className="studio-assets-pane">
          <div className="assets-tabs">
            <button onClick={() => setActiveTab('characters')} className={`assets-tab-btn ${activeTab === 'characters' ? 'active' : ''}`}>Characters</button>
            <button onClick={() => setActiveTab('edit')} className={`assets-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}>Edit Image</button>
          </div>
          <div className="assets-content">
            {activeTab === 'characters' && (
              <CharacterStudio 
                selectedCharacterId={studioState.selectedCharacterId}
                onSelectCharacter={(id) => setStudioState(prev => ({...prev, selectedCharacterId: id}))}
              />
            )}
            {activeTab === 'edit' && (
              studioState.baseImage ? (
                <div className="base-image-preview">
                    <img src={studioState.baseImage.dataUrl} alt="Base for editing" />
                    <p className="text-xs text-center mt-2 text-gray-400">{studioState.baseImage.name}</p>
                    <button 
                        onClick={() => setStudioState(prev => ({...prev, baseImage: null}))}
                        className="remove-base-img-btn"
                        title="Remove Image"
                    >
                      &#x2715;
                    </button>
                </div>
              ) : (
                <div 
                    className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                >
                    <i className="fas fa-file-image text-4xl mb-4"></i>
                    <p>Drop an image here to edit</p>
                    <p className="text-sm my-2">or</p>
                    <input type="file" id="base-image-upload" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])}/>
                    <label htmlFor="base-image-upload" className="action-btn btn-secondary cursor-pointer">Browse File</label>
                </div>
              )
            )}
          </div>
        </div>
        <div className="studio-workspace-pane">
            <div className="mode-selector">
                <button onClick={() => handleModeChange('text-to-image')} className={`mode-btn ${studioState.mode === 'text-to-image' ? 'active' : ''}`}>
                    Generate from Text
                </button>
                <button onClick={() => handleModeChange('image-edit')} className={`mode-btn ${studioState.mode === 'image-edit' ? 'active' : ''}`} disabled={!studioState.baseImage}>
                    Edit Uploaded Image
                </button>
            </div>
            <p className="text-center text-sm text-gray-400 mb-4">
                Enter your instructions in the main prompt bar below.
            </p>
            <div className="flex-grow min-h-0">
                <ImageGenerator imageResults={imageResults} loading={loading} error={error} />
            </div>
        </div>
      </div>
    </>
  );
};

export default ImageStudio;
