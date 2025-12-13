import React, { useState, useEffect } from 'react';

interface ComboCounterProps {
    onComboChange?: (combo: number) => void;
}

const ComboCounter: React.FC<ComboCounterProps> = ({ onComboChange }) => {
    const [combo, setCombo] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleClick = () => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;

            if (timeSinceLastClick < 1000) {
                // Within combo window
                const newCombo = combo + 1;
                setCombo(newCombo);
                setIsVisible(true);
                onComboChange?.(newCombo);
            } else {
                // Reset combo
                setCombo(1);
                setIsVisible(true);
                onComboChange?.(1);
            }

            setLastClickTime(now);

            // Hide after 2 seconds of inactivity
            setTimeout(() => {
                const timeSinceLast = Date.now() - now;
                if (timeSinceLast >= 2000) {
                    setIsVisible(false);
                    setCombo(0);
                }
            }, 2000);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [combo, lastClickTime, onComboChange]);

    if (!isVisible || combo === 0) return null;

    return (
        <div className="fixed top-1/4 right-20 z-[100] pointer-events-none">
            <div
                className="text-center animate-bounce"
                style={{
                    animation: combo > 5 ? 'pulse 0.3s ease-in-out infinite' : 'none'
                }}
            >
                <div
                    className={`text-6xl font-display font-bold mb-2 ${combo >= 10 ? 'text-purple-500' :
                            combo >= 5 ? 'text-red-500' :
                                'text-yellow-500'
                        }`}
                    style={{
                        textShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                        transform: `scale(${Math.min(1 + combo * 0.1, 2)})`,
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {combo}
                </div>
                <div className="text-2xl font-display text-white" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.7)' }}>
                    {combo >= 10 ? '🔥 LEGENDARY!' :
                        combo >= 5 ? '⚡ AMAZING!' :
                            'COMBO!'}
                </div>
            </div>
        </div>
    );
};

export default ComboCounter;
