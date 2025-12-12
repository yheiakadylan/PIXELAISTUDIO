import React, { useEffect, useState } from 'react';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
}

interface AchievementPopupProps {
    achievement: Achievement | null;
    onClose: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    return (
        <div
            className={`fixed top-20 right-4 z-[90] transition-all duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 border-4 border-black p-4 shadow-retro-xl min-w-[300px] animate-bounceIn">
                <div className="flex items-start gap-3">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                        <div className="text-xs font-display text-black/70 mb-1">🏆 ACHIEVEMENT UNLOCKED!</div>
                        <h3 className="font-display text-sm text-black mb-1">{achievement.title}</h3>
                        <p className="font-body text-xs text-black/80">{achievement.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Achievement tracker hook
export const useAchievements = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([
        { id: 'first_upload', title: 'First Upload!', description: 'Uploaded your first image', icon: '🎯', unlocked: false },
        { id: 'speed_demon', title: 'Speed Demon!', description: 'Processed 10 images', icon: '⚡', unlocked: false },
        { id: 'bg_master', title: 'Background Master!', description: 'Removed 5 backgrounds', icon: '✂️', unlocked: false },
        { id: 'resize_pro', title: 'Resize Pro!', description: 'Resized 10 images', icon: '📐', unlocked: false },
        { id: 'converter', title: 'Format Converter!', description: 'Converted 5 images', icon: '🔄', unlocked: false },
        { id: 'logo_lover', title: 'Logo Lover!', description: 'Clicked the logo 10 times', icon: '💙', unlocked: false },
        { id: 'super_master', title: 'Super Master!', description: 'Activated Super Mode! (Press S 3x)', icon: '⚡', unlocked: false },
    ]);

    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

    const unlockAchievement = (id: string) => {
        setAchievements(prev => {
            const achievement = prev.find(a => a.id === id);
            if (achievement && !achievement.unlocked) {
                const updated = prev.map(a =>
                    a.id === id ? { ...a, unlocked: true } : a
                );
                setCurrentAchievement(achievement);
                return updated;
            }
            return prev;
        });
    };

    return {
        achievements,
        currentAchievement,
        unlockAchievement,
        clearCurrentAchievement: () => setCurrentAchievement(null),
    };
};

export default AchievementPopup;
