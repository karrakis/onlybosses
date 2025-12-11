import React, { useEffect, useState } from 'react';

interface ShakeAnimationProps {
    children: React.ReactNode;
    isShaking: boolean;
    duration?: number; // in milliseconds
    intensity?: number; // in pixels
    onComplete?: () => void;
}

const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
    children,
    isShaking,
    duration = 500,
    intensity = 10,
    onComplete
}) => {
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
        if (isShaking) {
            setShouldShake(true);
            const timer = setTimeout(() => {
                setShouldShake(false);
                if (onComplete) {
                    onComplete();
                }
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isShaking, duration, onComplete]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(shouldShake && {
                    animation: `shake ${duration}ms ease-in-out`,
                    '--shake-intensity': `${intensity}px`
                } as React.CSSProperties)
            }}
        >
            {children}
        </div>
    );
};

export default ShakeAnimation;
