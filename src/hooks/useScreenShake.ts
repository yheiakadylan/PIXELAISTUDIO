import { useEffect, useState } from 'react';

interface ScreenShakeHook {
    triggerShake: (intensity?: number) => void;
    shakeStyle: React.CSSProperties;
}

export const useScreenShake = (): ScreenShakeHook => {
    const [isShaking, setIsShaking] = useState(false);
    const [intensity, setIntensity] = useState(10);

    const triggerShake = (shakeIntensity: number = 10) => {
        setIntensity(shakeIntensity);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const shakeStyle: React.CSSProperties = isShaking
        ? {
            animation: `screen-shake 0.5s ease-in-out`,
            animationIterationCount: '1',
        }
        : {};

    return { triggerShake, shakeStyle };
};

// Add this CSS to your index.css
export const screenShakeKeyframes = `
@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-10px, 5px); }
  20%, 40%, 60%, 80% { transform: translate(10px, -5px); }
}
`;
