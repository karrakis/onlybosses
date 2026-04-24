import React from 'react';

interface DepthCounterProps {
    depth: number;
}

const DepthCounter: React.FC<DepthCounterProps> = ({ depth }) => {
    const t = Math.min((depth - 1) / 9, 1);
    const orange = Math.round(255 * t);
    const red = Math.round(180 * t);
    const glowSpread = Math.round(4 + t * 20);
    const glowBlur = Math.round(8 + t * 32);
    const flickerAnim = t > 0.3 ? 'depth-flicker' : undefined;

    return (
        <div
            className="z-10 absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none"
            style={{
                textShadow: t > 0
                    ? `0 0 ${glowBlur / 2}px rgba(255,${255 - orange},0,${0.6 + t * 0.4}), 0 0 ${glowBlur}px rgba(255,${100 - red},0,${0.4 + t * 0.4}), 0 0 ${glowSpread * 2}px rgba(200,0,0,${t * 0.5})`
                    : undefined,
                animation: flickerAnim ? 'depthFlicker 1.8s ease-in-out infinite alternate' : undefined,
            }}
        >
            <span
                className="text-xs uppercase tracking-widest font-semibold"
                style={{ color: `rgba(255, ${Math.round(200 - orange * 0.6)}, ${Math.round(180 - orange)}, 0.85)` }}
            >
                Depth
            </span>
            <span
                className="text-4xl font-black leading-none"
                style={{
                    color: `rgb(255, ${Math.round(220 - orange * 0.8)}, ${Math.round(80 - 80 * t)})`,
                }}
            >
                {depth}
            </span>
        </div>
    );
};

export default DepthCounter;
