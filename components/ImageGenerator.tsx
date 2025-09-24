/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_IMAGE_GENERATOR
COLOR_ONION_HEX: NEON=#8B5CF6 FLUO=#7C3AED PASTEL=#DDD6FE
ICON_FAMILY: lucide
ICON_GLYPH: image
ICON_SIG: AL002016
5WH: WHAT=AI image generation component; WHY=Visual content creation and artistic capabilities; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\ImageGenerator.tsx; WHEN=2025-09-22; HOW=React component with image generation APIs
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import type { GenOut } from '../src/engines/engine.types';
import { renderTo } from '../src/ui/RenderSinks';

interface ImageGeneratorProps {
  imageResults: GenOut[];
  loading: boolean;
  error: string;
}

interface SingleImageDisplayProps {
    imageResult: GenOut;
}

const SingleImageDisplay: React.FC<SingleImageDisplayProps> = ({ imageResult }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (imageResult && imgRef.current && canvasRef.current) {
            renderTo(imgRef.current, canvasRef.current, imageResult);
        }
    }, [imageResult]);

    const showCanvas = imageResult?.type === 'rgba';
    const showImg = imageResult && (imageResult.type === 'base64' || imageResult.type === 'blob');

    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4">
            <img 
                ref={imgRef} 
                alt="Generated AI"
                className={`max-w-full max-h-[60vh] rounded-md mx-auto ${showImg ? 'block' : 'hidden'}`}
            />
            <canvas 
                ref={canvasRef} 
                className={`max-w-full max-h-[60vh] rounded-md mx-auto ${showCanvas ? 'block' : 'hidden'}`}
            />
        </div>
    );
};


const ImageGenerator: React.FC<ImageGeneratorProps> = ({ imageResults, loading, error }) => {
  const loadingMessage = "Creating high-quality image...";

  return (
    <div className="h-full flex flex-col items-center">
      <div className="flex-grow flex flex-col justify-center items-center w-full overflow-y-auto">
        {loading && <LoadingSpinner message={loadingMessage} />}
        {error && <ErrorMessage message={error} />}
        
        {imageResults.length > 0 && (
            <div className="w-full max-w-lg space-y-4">
                {imageResults.map((imageResult, index) => (
                    <SingleImageDisplay key={index} imageResult={imageResult} />
                ))}
            </div>
        )}

        {!loading && !error && imageResults.length === 0 && (
              <div className="text-center text-gray-500">
                  <p>Enter a prompt to generate an image using the Gemini API.</p>
              </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;