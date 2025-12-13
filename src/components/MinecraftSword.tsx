import React, { useEffect, useState } from 'react';

const MinecraftSword: React.FC = () => {
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isSlashing, setIsSlashing] = useState(false);

    useEffect(() => {
        const handleClick = (_e: MouseEvent) => {
            // Trigger slash animation
            setIsSlashing(true);

            // Reset after animation completes
            setTimeout(() => {
                setIsSlashing(false);
            }, 400);
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

            {/* Custom Cursor - Diamond Sword (same size as click sword) */}
            <div
                className="fixed pointer-events-none z-[100]"
                style={{
                    left: `${cursorPos.x}px`,
                    top: `${cursorPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <img
                    src="/Sword.gif"
                    alt="Sword Cursor"
                    className="w-16 h-16"
                    style={{
                        imageRendering: 'pixelated',
                        animation: isSlashing ? 'sword-slash-down 400ms ease-out forwards' : 'none',
                        transform: isSlashing ? 'none' : 'scaleX(-1)',
                    }}
                />
            </div>


        </>
    );
};

export default MinecraftSword;
