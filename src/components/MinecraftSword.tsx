import React, { useEffect, useState } from 'react';
import { soundEffects } from '../utils/soundEffects';

const MinecraftSword: React.FC = () => {
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isSlashing, setIsSlashing] = useState(false);

    useEffect(() => {
        const handleClick = (_e: MouseEvent) => {
            // Trigger slash animation
            setIsSlashing(true);

            // Play sword swing sound
            soundEffects.swordSwing();

            // Reset after animation completes
            setTimeout(() => {
                setIsSlashing(false);
            }, 250);
        };

        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <>
            {/* Hide default cursor */}
            <style>{`
                * {
                    cursor: none !important;
                }
            `}</style>

            {/* Custom Cursor - Diamond Sword with slash animation */}
            <div
                className="fixed pointer-events-none z-[100]"
                style={{
                    left: `${cursorPos.x}px`,
                    top: `${cursorPos.y}px`,
                    transform: 'translate(0, 0)', // Top-left corner at cursor
                }}
            >
                <img
                    src="/Sword.gif"
                    alt="Sword Cursor"
                    className="w-16 h-16"
                    style={{
                        imageRendering: 'pixelated',
                        animation: isSlashing ? 'sword-slash-down 111ms ease-out forwards' : 'none',
                        transform: isSlashing ? 'none' : 'scaleX(-1)',
                    }}
                />
            </div>


        </>
    );
};

export default MinecraftSword;
