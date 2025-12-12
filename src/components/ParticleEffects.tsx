import React, { useEffect, useState } from 'react';

interface ParticleEffectsProps {
    x: number;
    y: number;
    active: boolean;
    color?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    life: number;
    size: number;
}

const ParticleEffects: React.FC<ParticleEffectsProps> = ({
    x,
    y,
    active,
    color = '#fbbf24'
}) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!active) return;

        // Create sparkle particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            newParticles.push({
                id: Date.now() + i,
                x,
                y,
                velocityX: Math.cos(angle) * 3,
                velocityY: Math.sin(angle) * 3,
                life: 1,
                size: Math.random() * 4 + 2,
            });
        }

        setParticles(newParticles);

        const animationInterval = setInterval(() => {
            setParticles(prev => {
                return prev.map(p => ({
                    ...p,
                    x: p.x + p.velocityX,
                    y: p.y + p.velocityY,
                    life: p.life - 0.02,
                })).filter(p => p.life > 0);
            });
        }, 16);

        const timeout = setTimeout(() => {
            setParticles([]);
        }, 1000);

        return () => {
            clearInterval(animationInterval);
            clearTimeout(timeout);
        };
    }, [active, x, y]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        backgroundColor: color,
                        opacity: particle.life,
                        boxShadow: `0 0 ${particle.size * 2}px ${color}`,
                        transition: 'none',
                    }}
                />
            ))}
        </div>
    );
};

export default ParticleEffects;
