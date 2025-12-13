import React, { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';

type Emotion = 'happy' | 'scared' | 'excited' | 'sad';

interface PixelCharacterProps {
    onHit?: () => void;
}

const PixelCharacter: React.FC<PixelCharacterProps> = ({ onHit }) => {
    const [position, setPosition] = useState(0);
    const [direction, setDirection] = useState<'right' | 'left'>('right');
    const [isJumping, setIsJumping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [speed, setSpeed] = useState(2);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [isExcited, setIsExcited] = useState(false);
    const [emotion, setEmotion] = useState<Emotion>('happy');
    const [knockbackX, setKnockbackX] = useState(0);
    const [knockbackY, setKnockbackY] = useState(0);
    const [isFollowingMouse, setIsFollowingMouse] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Movement animation
        const moveInterval = setInterval(() => {
            setPosition(prev => {
                if (isFollowingMouse) {
                    // Follow mouse mode
                    const targetX = mousePos.x - 50;
                    const diff = targetX - prev;
                    if (Math.abs(diff) > 10) {
                        setDirection(diff > 0 ? 'right' : 'left');
                        return prev + (diff > 0 ? speed * 2 : -speed * 2);
                    }
                    return prev;
                }

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
            if (!isJumping && Math.random() > 0.7 && !isFollowingMouse) {
                setIsJumping(true);
                setTimeout(() => setIsJumping(false), 600);
            }
        }, 1500);

        return () => {
            clearInterval(moveInterval);
            clearInterval(jumpInterval);
        };
    }, [direction, isJumping, speed, isFollowingMouse, mousePos]);

    // Check for sword hits nearby
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const petX = position + 50;
            const petY = window.innerHeight - 40;
            const distance = Math.sqrt(
                Math.pow(e.clientX - petX, 2) + Math.pow(e.clientY - petY, 2)
            );

            // If sword hit near pet (within 150px)
            if (distance < 150) {
                // Knockback effect
                const angle = Math.atan2(petY - e.clientY, petX - e.clientX);
                const knockbackDistance = 80;
                setKnockbackX(Math.cos(angle) * knockbackDistance);
                setKnockbackY(Math.sin(angle) * knockbackDistance);

                // Change to scared emotion
                setEmotion('scared');
                soundEffects.error?.();
                onHit?.();

                // Reset knockback and emotion
                setTimeout(() => {
                    setKnockbackX(0);
                    setKnockbackY(0);
                }, 300);

                setTimeout(() => {
                    setEmotion('happy');
                }, 2000);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [position, onHit]);

    // Follow mouse mode detection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                setIsFollowingMouse(true);
                setEmotion('excited');
                soundEffects.success();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                setIsFollowingMouse(false);
                setEmotion('happy');
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleClick = () => {
        const now = Date.now();
        const timeDiff = now - lastClickTime;

        // Double click detection (within 300ms)
        if (timeDiff < 300) {
            // Double click - make it run faster temporarily
            setSpeed(6);
            setIsExcited(true);
            setEmotion('excited');
            soundEffects.success();
            setTimeout(() => {
                setSpeed(2);
                setIsExcited(false);
                setEmotion('happy');
            }, 3000);
        } else {
            // Single click - make it jump
            if (!isJumping) {
                setIsJumping(true);
                setEmotion('happy');
                soundEffects.click();
                setTimeout(() => setIsJumping(false), 600);
            }
        }

        setLastClickTime(now);
    };

    // Get eye style based on emotion
    const getEyeStyle = () => {
        switch (emotion) {
            case 'scared':
                return 'w-3 h-3'; // Wide eyes
            case 'excited':
                return 'w-2 h-3 animate-pulse'; // Sparkling
            case 'sad':
                return 'w-2 h-1'; // Closed
            default:
                return 'w-2 h-2'; // Normal
        }
    };

    // Get mouth style based on emotion
    const getMouthStyle = () => {
        switch (emotion) {
            case 'scared':
                return 'w-4 h-3 rounded-full'; // Open mouth
            case 'excited':
                return 'h-1 rounded-sm'; // Big smile
            case 'sad':
                return 'h-1 rounded-t-full'; // Frown
            default:
                return 'h-1'; // Normal smile
        }
    };

    return (
        <div
            className="fixed bottom-0 z-50 transition-transform duration-75 cursor-pointer"
            style={{
                left: `${position}px`,
                transform: `scaleX(${direction === 'left' ? -1 : 1}) ${isHovered ? 'scale(1.1)' : 'scale(1)'}  translate(${knockbackX}px, ${knockbackY}px)`,
                pointerEvents: 'auto',
                transition: knockbackX !== 0 ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.075s linear',
            }}
            onClick={handleClick}
            onMouseEnter={() => {
                setIsHovered(true);
                setEmotion('happy');
                soundEffects.toggle();
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                if (emotion === 'happy') setEmotion('happy');
            }}
            title={isFollowingMouse ? "Following you! Release F to stop" : "Click me! (Double-click or hold F)"}
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
                    <div className={`absolute top-0 left-4 w-8 h-8 ${emotion === 'scared' ? 'bg-blue-300' :
                            emotion === 'sad' ? 'bg-gray-400' :
                                isExcited ? 'bg-orange-500' : 'bg-yellow-600'
                        } border-2 border-black transition-colors duration-300`}>
                        {/* Eyes */}
                        <div className={`absolute top-2 left-1 bg-black ${getEyeStyle()}`}></div>
                        <div className={`absolute top-2 right-1 bg-black ${getEyeStyle()}`}></div>
                        {/* Mouth */}
                        <div className={`absolute bottom-1 left-1 right-1 bg-black ${getMouthStyle()}`}></div>

                        {/* Scared sweat drops */}
                        {emotion === 'scared' && (
                            <>
                                <div className="absolute -top-1 left-0 text-sm animate-bounce">💧</div>
                                <div className="absolute -top-1 right-0 text-sm animate-bounce" style={{ animationDelay: '0.2s' }}>💧</div>
                            </>
                        )}
                    </div>

                    {/* Body */}
                    <div className={`absolute top-8 left-3 w-10 h-8 ${emotion === 'scared' ? 'bg-gray-300' :
                            isExcited ? 'bg-red-600' : 'bg-blue-600'
                        } border-2 border-black transition-colors duration-300`}></div>

                    {/* Arms - animated */}
                    <div className={`absolute top-9 left-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'right' || isExcited || emotion === 'scared' ? 'animate-wiggle' : ''
                        }`}></div>
                    <div className={`absolute top-9 right-0 w-3 h-6 bg-yellow-600 border-2 border-black ${direction === 'left' || isExcited || emotion === 'scared' ? 'animate-wiggle' : ''
                        }`}></div>

                    {/* Legs - animated walking */}
                    <div className="absolute bottom-0 left-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-left"></div>
                    <div className="absolute bottom-0 right-3 w-4 h-6 bg-blue-900 border-2 border-black animate-walk-right"></div>

                    {/* Excited particles */}
                    {(isExcited || emotion === 'excited') && (
                        <>
                            <div className="absolute -top-2 left-0 text-xl animate-ping">⭐</div>
                            <div className="absolute -top-2 right-0 text-xl animate-ping" style={{ animationDelay: '0.2s' }}>✨</div>
                        </>
                    )}

                    {/* Following mode indicator */}
                    {isFollowingMouse && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">❤️</div>
                    )}
                </div>

                {/* Shadow */}
                <div className={`absolute -bottom-1 left-2 w-12 h-2 bg-black opacity-20 rounded-full blur-sm ${isJumping ? 'scale-75' : 'scale-100'} transition-transform duration-300`}></div>
            </div>
        </div>
    );
};

export default PixelCharacter;
