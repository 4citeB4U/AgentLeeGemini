/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_AUDIO_ANALYZER
COLOR_ONION_HEX: NEON=#FF6B6B FLUO=#FF5722 PASTEL=#FFAB91
ICON_FAMILY: lucide
ICON_GLYPH: volume-2
ICON_SIG: AL003007
5WH: WHAT=Audio file upload, transcription, and analysis component; WHY=Audio processing and analysis functionality; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\AudioAnalyzer.tsx; WHEN=2025-09-23; HOW=React component with audio file handling and transcription
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface AudioAnalyzerProps {
    result: string;
    loading: boolean;
    error: string;
    file: File | null;
    setFile: (file: File | null) => void;
    onStartNew: () => void;
}

export const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ 
    result, 
    loading, 
    error, 
    file, 
    setFile, 
    onStartNew 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        // Validate file type (audio files)
        const validTypes = [
            'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 
            'audio/m4a', 'audio/aac', 'audio/webm', 'audio/flac'
        ];
        
        if (!validTypes.includes(selectedFile.type)) {
            alert('Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, WebM, FLAC).');
            return;
        }

        // Check file size (50MB limit)
        if (selectedFile.size > 50 * 1024 * 1024) {
            alert('Audio file must be smaller than 50MB.');
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="audio-analyzer-container">
            <style>{`
                .audio-analyzer-container {
                    padding: 1.5rem;
                    max-width: 4xl;
                    margin: 0 auto;
                }
                
                .audio-upload-area {
                    border: 2px dashed #d4af37;
                    border-radius: 0.75rem;
                    padding: 3rem 2rem;
                    text-align: center;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .audio-upload-area:hover {
                    border-color: #f4d03f;
                    background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
                    transform: translateY(-2px);
                }
                
                .audio-upload-area.has-file {
                    border-color: #4ade80;
                    background: linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%);
                }
                
                .upload-icon {
                    width: 3rem;
                    height: 3rem;
                    color: #d4af37;
                    margin: 0 auto 1rem;
                }
                
                .upload-text {
                    color: #f9fafb;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                
                .upload-hint {
                    color: #9ca3af;
                    font-size: 0.875rem;
                }
                
                .file-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 0.5rem;
                    padding: 1rem;
                    margin-top: 1rem;
                    text-align: left;
                }
                
                .audio-controls {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                    justify-content: center;
                }
                
                .audio-btn {
                    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                    color: #1a1a1a;
                    border: none;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .audio-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
                }
                
                .audio-btn.secondary {
                    background: transparent;
                    color: #d4af37;
                    border: 2px solid #d4af37;
                }
                
                .results-container {
                    margin-top: 2rem;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 0.75rem;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                }
                
                .results-title {
                    color: #d4af37;
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .results-content {
                    color: #f9fafb;
                    line-height: 1.6;
                    white-space: pre-wrap;
                }
                
                .audio-player {
                    width: 100%;
                    max-width: 400px;
                }
                
                .hidden {
                    display: none;
                }
            `}</style>

            <div className="space-y-6">
                <div 
                    className={`audio-upload-area ${file ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon">
                        🎵
                    </div>
                    
                    {!file ? (
                        <>
                            <div className="upload-text">
                                Drop audio file here or click to browse
                            </div>
                            <div className="upload-hint">
                                Supports MP3, WAV, OGG, M4A, AAC, WebM, FLAC (max 50MB)
                            </div>
                        </>
                    ) : (
                        <div className="file-info">
                            <div className="upload-text">📁 {file.name}</div>
                            <div className="upload-hint">
                                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB | Type: {file.type}
                            </div>
                        </div>
                    )}
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        title="Select audio file for analysis"
                        aria-label="Audio file input"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                                handleFileSelect(selectedFile);
                            }
                        }}
                        className="hidden"
                    />
                </div>

                {file && (
                    <div className="audio-controls">
                        <audio controls className="audio-player">
                            <source src={URL.createObjectURL(file)} type={file.type} />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {file && (
                    <div className="audio-controls">
                        <button 
                            className="audio-btn"
                            onClick={onStartNew}
                            disabled={loading}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Audio'}
                        </button>
                        <button 
                            className="audio-btn secondary"
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                        >
                            Remove File
                        </button>
                    </div>
                )}

                {loading && <LoadingSpinner message="Analyzing audio..." />}
                {error && <ErrorMessage message={error} />}

                {result && (
                    <div className="results-container">
                        <div className="results-title">
                            🔍 Audio Analysis Results
                        </div>
                        <div className="results-content">
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioAnalyzer;