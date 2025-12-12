import React, { useState, useEffect } from 'react';

const PixelCharacter: React.FC = () => {
    const [position, setPosition] = useState(0);
    const [direction, setDirection] = useState<'right' | 'left'>('right');
    const [isJumping, setIsJumping] = useState(false);

    useEffect(() => {
        // Movement animation
        const moveInterval = setInterval(() => {
            setPosition(prev => {
                const newPos = direction === 'right' ? prev + 2 : prev - 2;

                // Bounce back when reaching edges (accounting for character width)
                if (newPos >= window.innerWidth - 100) {
                    setDirection('left');
                    return window.innerWidth - 100;
                }
                if (newPos <= 0) {
                    setDirection('right');
                    return 0;
                }

                return newPos;
            });
        }, 50);

        // Random jumping
        const jumpInterval = setInterval(() => {
            if (!isJumping && Math.random() > 0.7) {
                setIsJumping(true);
                setTimeout(() => setIsJumping(false), 600);
            }
        }, 1500);

        return () => {
            clearInterval(moveInterval);
            clearInterval(jumpInterval);
        };
    }, [direction, isJumping]);

    return (
        <div
            className="fixed bottom-0 z-50 pointer-events-none transition-transform duration-75"
            style={{
                left: `${position}px`,
                transform: `scaleX(${direction === 'left' ? -1 : 1})`,
            }}
        >
            <div
                className={`relative ${isJumping ? 'animate-bounce' : ''}`}
                style={{
                    animation: isJumping ? 'jump 0.6s ease-in-out' : 'none'
                }}
            >
                {/* Pixel Art Character */}
                <div className="relative w-16 h-20">
                    {/* Head */}
                    <div className="absolute top-0 left-4 w-8 h-8 bg-yellow-600 border-2 border-black">
                        {/* Eyes */}
                        <div className="absolute top-2 left-1 w-2 h-2 bg-black"></div>
                        <div className="absolute top-2 right-1 w-2 h-2 bg-black"></div>
                        {/* Smile */}
                        <div className="absolute bottom-1 left-1 right-1 h-1 bg-black"></div>
                    </div>

                    {/* Body */}
                    <div className="absolute top-8 left-3 w-10 h-8 bg-blue-600 border-2 border-black"></div>

                    {/* Arms - animated */}
                    <div className={`absolute top-9 left-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'right' ? 'animate-wiggle' : ''}`}></div>
                    <div className={`absolute top-9 right-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'left' ? 'animate-wiggle' : ''}`}></div>

                    {/* Legs - animated walking */}
                    <div className="absolute bottom-0 left-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-left"></div>
                    <div className="absolute bottom-0 right-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-right"></div>
                </div>

                {/* Shadow */}
                <div className="absolute -bottom-1 left-2 w-12 h-2 bg-black opacity-20 rounded-full blur-sm"></div>
            </div>
        </div>
    );
};

export default PixelCharacter;
