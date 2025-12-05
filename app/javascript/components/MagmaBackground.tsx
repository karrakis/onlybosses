import React from 'react';

const MagmaBackground: React.FC = () => {
    return (
        <>
            <style>{`
                @keyframes magma {
                    0%, 100% {
                        background-position: 0% 50%;
                        background-size: 200% 200%;
                    }
                    25% {
                        background-position: 100% 50%;
                        background-size: 250% 250%;
                    }
                    50% {
                        background-position: 50% 100%;
                        background-size: 200% 200%;
                    }
                    75% {
                        background-position: 0% 0%;
                        background-size: 220% 220%;
                    }
                }
                
                .magma-background {
                    background: radial-gradient(circle at 20% 50%, #dc2626 0%, #450a0a 25%, #000000 50%),
                                radial-gradient(circle at 80% 80%, #991b1b 0%, #1a0000 40%, #000000 70%),
                                radial-gradient(circle at 40% 20%, #ef4444 0%, #7f1d1d 30%, #000000 60%);
                    background-blend-mode: screen;
                    animation: magma 10s ease-in-out infinite;
                    z-index: -1;
                }
            `}</style>
            <div className="absolute inset-0 magma-background"></div>
        </>
    );
};

export default MagmaBackground;
