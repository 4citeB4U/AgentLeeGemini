/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_AVATAR
COLOR_ONION_HEX: NEON=#FF8C00 FLUO=#FFA500 PASTEL=#FFD700
ICON_FAMILY: lucide
ICON_GLYPH: user-circle
ICON_SIG: AL002002
5WH: WHAT=Agent Lee avatar display component; WHY=Visual representation of agent state and persona; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\components\AgentAvatar.tsx; WHEN=2025-09-22; HOW=React component with state-based animations
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { useEffect, useRef } from 'react';
import type { AgentState } from '../types';

interface AgentAvatarProps {
    agentState: AgentState;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ agentState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.6;
        let angle = 0;

        const render = () => {
            let speed = 0.02; // Base speed
            switch (agentState) {
                case 'listening': speed = 0.05; break;
                case 'thinking': speed = 0.1; break;
                case 'speaking': speed = 0.03; break;
                default: speed = 0.02; break;
            }
            angle += speed;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Pulsating core
            let pulseAmplitude = agentState === 'speaking' ? 0.15 : 0.08;
            let pulseFrequency = agentState === 'listening' ? 4 : 2;
            const corePulse = Math.max(0, (Math.sin(angle * pulseFrequency) * pulseAmplitude + 0.3) * radius);
            ctx.beginPath();
            ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(212, 175, 55, 0.8)'; // --accent-bg
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Outer rings
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * (0.5 + i * 0.15), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(212, 175, 55, ${0.5 - i * 0.15})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            
            // Orbiting particles
            const numParticles = agentState === 'thinking' ? 5 : 3;
            for (let i = 0; i < numParticles; i++) {
                const orbitRadius = radius * (0.6 + Math.sin(angle + i * 2) * (agentState === 'thinking' ? 0.2 : 0.1));
                const particleAngle = angle * (1 + i * 0.2) + i * (Math.PI * 2 / numParticles);
                const px = centerX + orbitRadius * Math.cos(particleAngle);
                const py = centerY + orbitRadius * Math.sin(particleAngle);
                
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#d4af37';
                ctx.fill();
            }

            // NEW: More complex waveform when speaking to mimic a real audio signal
            if (agentState === 'speaking') {
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 1.5;
                ctx.shadowColor = '#d4af37';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                
                const yOffset = canvas.height * 0.8;
                const baseAmplitude = canvas.height * 0.1;
                const time = angle * 10; // Use angle as a time component for animation
                
                ctx.moveTo(0, yOffset);
                for (let x = 0; x < canvas.width; x++) {
                    // Combine multiple sine waves for a more complex waveform
                    const wave1 = Math.sin(x * 0.05 + time) * baseAmplitude * 0.5;
                    const wave2 = Math.sin(x * 0.1 + time * 1.5) * baseAmplitude * 0.25;
                    // Add some high-frequency noise for a jagged, realistic look
                    const noise = (Math.random() - 0.5) * baseAmplitude * 0.15;
                    const y = yOffset + wave1 + wave2 + noise;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }


            animationFrameId = window.requestAnimationFrame(render);
        };

        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [agentState]);

    const statusMap = {
        idle: { text: "STATUS: ONLINE", color: "#00cc66", shadow: "0 0 5px #00cc66" },
        listening: { text: "STATUS: LISTENING", color: "#63b3ed", shadow: "0 0 5px #63b3ed" },
        thinking: { text: "STATUS: PROCESSING", color: "#f472b6", shadow: "0 0 5px #f472b6" },
        speaking: { text: "STATUS: TRANSMITTING", color: "#d4af37", shadow: "0 0 5px #d4af37" },
    };

    const currentStatus = statusMap[agentState];


    const styles = `
        .avatar-container {
            background-color: #111;
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            text-align: center;
            height: 200px;
            flex-shrink: 0;
        }
        .avatar-header {
            color: var(--text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
        }
        .canvas-wrapper {
            flex-grow: 1;
            position: relative;
            min-height: 0;
        }
        .avatar-canvas {
            width: 100%;
            height: 100%;
        }
        .status-text {
            font-weight: 600;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            transition: color 0.3s ease, text-shadow 0.3s ease;
            white-space: nowrap;
        }
        .status-text.status-idle {
            color: #00cc66;
            text-shadow: 0 0 5px #00cc66;
        }
        .status-text.status-listening {
            color: #63b3ed;
            text-shadow: 0 0 5px #63b3ed;
        }
        .status-text.status-thinking {
            color: #f472b6;
            text-shadow: 0 0 5px #f472b6;
        }
        .status-text.status-speaking {
            color: #d4af37;
            text-shadow: 0 0 5px #d4af37;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="avatar-container">
                <h3 className="avatar-header">Agent Status</h3>
                <div className="canvas-wrapper">
                    <canvas ref={canvasRef} className="avatar-canvas"></canvas>
                </div>
                <p className={`status-text status-${agentState}`}>
                    {currentStatus.text}
                </p>
            </div>
        </>
    );
};

export default AgentAvatar;