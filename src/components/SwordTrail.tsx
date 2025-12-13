import React, { useEffect, useState } from 'react';

interface TrailPoint {
    id: number;
    x: number;
    y: number;
}

const SwordTrail: React.FC = () => {
    const [trail, setTrail] = useState<TrailPoint[]>([]);

    useEffect(() => {
        let lastTime = 0;
        const throttleDelay = 30; // Add points every 30ms for more spacing

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastTime < throttleDelay) return; // Skip if too soon
            lastTime = now;

            // Calculate sword bottom-right corner position
            // Sword is 64x64 (w-16 h-16)
            const swordSize = 64;
            const offsetX = swordSize; // Bottom-right corner X
            const offsetY = swordSize; // Bottom-right corner Y

            const newPoint: TrailPoint = {
                id: now,
                x: e.clientX + offsetX,
                y: e.clientY + offsetY,
            };


            setTrail(prev => [...prev.slice(-40), newPoint]); // Keep last 40 points for longer trail

            // Remove point after fade
            setTimeout(() => {
                setTrail(prev => prev.filter(p => p.id !== newPoint.id));
            }, 1000); // Match animation duration
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[99]">
            {trail.map((point, index) => (
                <div
                    key={point.id}
                    className="absolute w-3 h-3 bg-purple-400"
                    style={{
                        left: `${point.x}px`,
                        top: `${point.y}px`,
                        transform: 'translate(0, 0)', // No centering - use exact position
                        opacity: (index + 1) / trail.length * 0.7,
                        animation: 'fade-out 1000ms ease-out forwards',
                        boxShadow: '0 0 8px rgba(192, 132, 252, 0.6)',
                        imageRendering: 'pixelated', // Crisp pixel art edges
                    }}
                />
            ))}
        </div>
    );
};

export default SwordTrail;
