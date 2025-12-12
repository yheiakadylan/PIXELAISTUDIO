import React, { useEffect, useState } from 'react';

const CursorTrail: React.FC = () => {
    const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

    useEffect(() => {
        let trailId = 0;

        const handleMouseMove = (e: MouseEvent) => {
            setTrail(prev => {
                const newTrail = [
                    ...prev,
                    { x: e.clientX, y: e.clientY, id: trailId++ }
                ].slice(-15); // Keep last 15 points

                return newTrail;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Fade out trail
        const fadeInterval = setInterval(() => {
            setTrail(prev => prev.slice(1));
        }, 50);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(fadeInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[85]">
            {trail.map((point, index) => (
                <div
                    key={point.id}
                    className="absolute w-2 h-2 bg-blue-500 border border-black"
                    style={{
                        left: `${point.x - 4}px`,
                        top: `${point.y - 4}px`,
                        opacity: (index / trail.length) * 0.5,
                        transform: `scale(${index / trail.length})`,
                        transition: 'opacity 0.3s, transform 0.3s',
                    }}
                />
            ))}
        </div>
    );
};

export default CursorTrail;
