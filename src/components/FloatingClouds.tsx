import React from 'react';

const FloatingClouds: React.FC = () => {
    const clouds = [
        { id: 1, size: 'large', top: '10%', delay: '0s', duration: '60s' },
        { id: 2, size: 'medium', top: '30%', delay: '10s', duration: '80s' },
        { id: 3, size: 'small', top: '50%', delay: '20s', duration: '70s' },
        { id: 4, size: 'medium', top: '70%', delay: '15s', duration: '90s' },
        { id: 5, size: 'large', top: '20%', delay: '30s', duration: '75s' },
    ];

    const renderCloud = (size: string) => {
        const scale = size === 'large' ? 1 : size === 'medium' ? 0.7 : 0.5;
        const opacity = size === 'large' ? 0.4 : size === 'medium' ? 0.3 : 0.2;

        return (
            <svg width={80 * scale} height={40 * scale} viewBox="0 0 80 40" fill="none">
                {/* Pixel cloud shape */}
                <rect x="20" y="20" width="10" height="10" fill="currentColor" opacity={opacity} />
                <rect x="30" y="10" width="10" height="30" fill="currentColor" opacity={opacity} />
                <rect x="40" y="10" width="10" height="30" fill="currentColor" opacity={opacity} />
                <rect x="50" y="15" width="10" height="20" fill="currentColor" opacity={opacity} />
                <rect x="10" y="25" width="10" height="10" fill="currentColor" opacity={opacity} />
                <rect x="60" y="20" width="10" height="10" fill="currentColor" opacity={opacity} />
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {clouds.map(cloud => (
                <div
                    key={cloud.id}
                    className="absolute text-blue-300 dark:text-blue-800"
                    style={{
                        top: cloud.top,
                        animation: `float-cloud ${cloud.duration} linear infinite`,
                        animationDelay: cloud.delay,
                        left: '-100px',
                    }}
                >
                    {renderCloud(cloud.size)}
                </div>
            ))}
        </div>
    );
};

export default FloatingClouds;
