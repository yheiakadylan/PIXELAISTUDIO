import React, { useEffect, useState } from 'react';

interface SwordSwing {
    id: number;
    x: number;
    y: number;
}

const MinecraftSword: React.FC = () => {
    const [swings, setSwings] = useState<SwordSwing[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newSwing: SwordSwing = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
            };

            setSwings(prev => [...prev, newSwing]);

            // Remove swing after animation completes
            setTimeout(() => {
                setSwings(prev => prev.filter(s => s.id !== newSwing.id));
            }, 600);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[95]">
            {swings.map(swing => (
                <div
                    key={swing.id}
                    className="absolute"
                    style={{
                        left: `${swing.x - 30}px`,
                        top: `${swing.y - 30}px`,
                        animation: 'sword-swing 600ms ease-out forwards',
                    }}
                >
                    {/* Minecraft Diamond Sword */}
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        {/* Handle (brown) */}
                        <rect x="24" y="40" width="4" height="8" fill="#8B4513" stroke="#000" strokeWidth="1" />
                        <rect x="20" y="48" width="12" height="4" fill="#654321" stroke="#000" strokeWidth="1" />

                        {/* Guard (gold) */}
                        <rect x="18" y="36" width="16" height="4" fill="#FFD700" stroke="#000" strokeWidth="1" />

                        {/* Blade (cyan/diamond) */}
                        <rect x="26" y="8" width="4" height="4" fill="#00FFFF" stroke="#000" strokeWidth="1" />
                        <rect x="24" y="12" width="6" height="4" fill="#00CED1" stroke="#000" strokeWidth="1" />
                        <rect x="22" y="16" width="8" height="4" fill="#40E0D0" stroke="#000" strokeWidth="1" />
                        <rect x="24" y="20" width="6" height="4" fill="#00CED1" stroke="#000" strokeWidth="1" />
                        <rect x="24" y="24" width="6" height="4" fill="#40E0D0" stroke="#000" strokeWidth="1" />
                        <rect x="24" y="28" width="6" height="4" fill="#00CED1" stroke="#000" strokeWidth="1" />
                        <rect x="24" y="32" width="6" height="4" fill="#40E0D0" stroke="#000" strokeWidth="1" />

                        {/* Tip */}
                        <rect x="26" y="4" width="2" height="4" fill="#00FFFF" stroke="#000" strokeWidth="1" />
                    </svg>
                </div>
            ))}
        </div>
    );
};

export default MinecraftSword;
