import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 10, // Position above the element
                left: rect.left + rect.width / 2, // Center horizontally
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
        }
    }, [isVisible]);

    return (
        <span
            ref={triggerRef}
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className="fixed z-[100] transform -translate-x-1/2 -translate-y-full mb-2 pointer-events-none"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                >
                    <div className="bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-2 text-sm text-white shadow-xl max-w-xs whitespace-normal">
                        {text}
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-600"></div>
                </div>
            )}
        </span>
    );
};

export default Tooltip;
