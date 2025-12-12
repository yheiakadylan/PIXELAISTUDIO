import React, { useEffect, useState } from 'react';

interface ConfettiProps {
    active: boolean;
    onComplete?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    velocityX: number;
    velocityY: number;
    size: number;
}

const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!active) return;

        // Create confetti particles
        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
        const newParticles: Particle[] = [];

        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                velocityX: (Math.random() - 0.5) * 5,
                velocityY: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
            });
        }

        setParticles(newParticles);

        // Animate particles
        const animationInterval = setInterval(() => {
            setParticles(prev => {
                const updated = prev.map(p => ({
                    ...p,
                    x: p.x + p.velocityX,
                    y: p.y + p.velocityY,
                    rotation: p.rotation + 5,
                    velocityY: p.velocityY + 0.1, // gravity
                })).filter(p => p.y < window.innerHeight + 50);

                if (updated.length === 0 && onComplete) {
                    onComplete();
                }

                return updated;
            });
        }, 16);

        // Cleanup after 5 seconds
        const timeout = setTimeout(() => {
            setParticles([]);
            if (onComplete) onComplete();
        }, 5000);

        return () => {
            clearInterval(animationInterval);
            clearTimeout(timeout);
        };
    }, [active, onComplete]);

    if (!active || particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        backgroundColor: particle.color,
                        transform: `rotate(${particle.rotation}deg)`,
                        transition: 'none',
                        border: '1px solid rgba(0,0,0,0.3)',
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
