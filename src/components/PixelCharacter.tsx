import React, { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';

const PixelCharacter: React.FC = () => {
    const [position, setPosition] = useState(0);
    const [direction, setDirection] = useState<'right' | 'left'>('right');
    const [isJumping, setIsJumping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [speed, setSpeed] = useState(2);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [isExcited, setIsExcited] = useState(false);

    useEffect(() => {
        // Movement animation
        const moveInterval = setInterval(() => {
            setPosition(prev => {
                const newPos = direction === 'right' ? prev + speed : prev - speed;

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
    }, [direction, isJumping, speed]);

    const handleClick = () => {
        const now = Date.now();
        const timeDiff = now - lastClickTime;

        // Double click detection (within 300ms)
        if (timeDiff < 300) {
            // Double click - make it run faster temporarily
            setSpeed(6);
            setIsExcited(true);
            soundEffects.success();
            setTimeout(() => {
                setSpeed(2);
                setIsExcited(false);
            }, 3000);
        } else {
            // Single click - make it jump
            if (!isJumping) {
                setIsJumping(true);
                soundEffects.click();
                setTimeout(() => setIsJumping(false), 600);
            }
        }

        setLastClickTime(now);
    };

    return (
        <div
            className="fixed bottom-0 z-50 transition-transform duration-75 cursor-pointer"
            style={{
                left: `${position}px`,
                transform: `scaleX(${direction === 'left' ? -1 : 1}) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`,
                pointerEvents: 'auto',
            }}
            onClick={handleClick}
            onMouseEnter={() => {
                setIsHovered(true);
                soundEffects.toggle();
            }}
            onMouseLeave={() => setIsHovered(false)}
            title="Click me! (Double-click for a surprise!)"
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
                    <div className={`absolute top-0 left-4 w-8 h-8 ${isExcited ? 'bg-orange-500' : 'bg-yellow-600'} border-2 border-black transition-colors duration-300`}>
                        {/* Eyes */}
                        <div className={`absolute top-2 left-1 w-2 h-2 bg-black ${isExcited ? 'animate-pulse' : ''}`}></div>
                        <div className={`absolute top-2 right-1 w-2 h-2 bg-black ${isExcited ? 'animate-pulse' : ''}`}></div>
                        {/* Smile */}
                        <div className={`absolute bottom-1 left-1 right-1 h-1 bg-black ${isExcited ? 'animate-pulse' : ''}`}></div>
                    </div>

                    {/* Body */}
                    <div className={`absolute top-8 left-3 w-10 h-8 ${isExcited ? 'bg-red-600' : 'bg-blue-600'} border-2 border-black transition-colors duration-300`}></div>

                    {/* Arms - animated */}
                    <div className={`absolute top-9 left-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'right' || isExcited ? 'animate-wiggle' : ''}`}></div>
                    <div className={`absolute top-9 right-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'left' || isExcited ? 'animate-wiggle' : ''}`}></div>

                    {/* Legs - animated walking */}
                    <div className="absolute bottom-0 left-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-left"></div>
                    <div className="absolute bottom-0 right-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-right"></div>

                    {/* Excited particles */}
                    {isExcited && (
                        <>
                            <div className="absolute -top-2 left-0 text-xl animate-ping">⭐</div>
                            <div className="absolute -top-2 right-0 text-xl animate-ping" style={{ animationDelay: '0.2s' }}>✨</div>
                        </>
                    )}
                </div>

                {/* Shadow */}
                <div className={`absolute -bottom-1 left-2 w-12 h-2 bg-black opacity-20 rounded-full blur-sm ${isJumping ? 'scale-75' : 'scale-100'} transition-transform duration-300`}></div>
            </div>
        </div>
    );
};

export default PixelCharacter;
