/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_SPOTLIGHT
COLOR_ONION_HEX: NEON=#F97316 FLUO=#EA580C PASTEL=#FED7AA
ICON_FAMILY: lucide
ICON_GLYPH: search
ICON_SIG: AL002010
5WH: WHAT=Spotlight search and quick actions component; WHY=Fast access to commands and information; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\Spotlight.tsx; WHEN=2025-09-22; HOW=React component with keyboard shortcuts
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useState, useEffect, useRef } from 'react';

interface SpotlightProps {
    targetRect: DOMRect | null;
    isActive: boolean;
}

const Spotlight: React.FC<SpotlightProps> = ({ targetRect, isActive }) => {
    if (!isActive || !targetRect) {
        return null;
    }

    const padding = 15;
    const { top, left, width, height } = targetRect;
    
    const spotlightId = 'spotlight-overlay-' + Date.now();
    
    return (
        <>
            <style>{`
                .spotlight-overlay {
                    position: fixed;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
                    border-radius: 8px;
                    z-index: 9998;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                #${spotlightId} {
                    top: ${top - padding}px;
                    left: ${left - padding}px;
                    width: ${width + padding * 2}px;
                    height: ${height + padding * 2}px;
                }
            `}</style>
            <div id={spotlightId} className="spotlight-overlay"></div>
        </>
    );
};

export default Spotlight;
