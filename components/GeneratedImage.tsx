/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_GENERATED_IMAGE
COLOR_ONION_HEX: NEON=#C084FC FLUO=#A855F7 PASTEL=#F3E8FF
ICON_FAMILY: lucide
ICON_GLYPH: image-plus
ICON_SIG: AL002023
5WH: WHAT=Generated image display component; WHY=Display and manage AI-generated visual content; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\GeneratedImage.tsx; WHEN=2025-09-22; HOW=React component with image handling
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface GeneratedImageProps {
  prompt: string;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ prompt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const generate = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await geminiService.generateImage(prompt);
        setImageUrl(result);
      } catch (err: any) {
        setError(err.message || 'Failed to generate image.');
        console.error(`Failed to generate image for prompt "${prompt}":`, err);
      } finally {
        setLoading(false);
      }
    };

    if (prompt) {
        generate();
    }
  }, [prompt]);

  return (
    <div className="my-6 p-2 border border-gray-300 rounded-lg bg-gray-50 text-center shadow-sm">
      {loading && <LoadingSpinner message="Generating image..." />}
      {error && <ErrorMessage message={error} />}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt={`Generated image for: ${prompt}`}
            className="w-full h-auto object-cover rounded-md"
            loading="lazy"
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            AI-generated image for: "{prompt}"
          </p>
        </>
      )}
    </div>
  );
};

export default GeneratedImage;
