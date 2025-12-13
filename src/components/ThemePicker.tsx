import React, { useState, useEffect } from 'react';
import { themes, applyTheme, type Theme } from '../utils/themes';

interface ThemePickerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ isOpen, onClose }) => {
    const [selectedTheme, setSelectedTheme] = useState<string>('classic');

    useEffect(() => {
        const saved = localStorage.getItem('selectedTheme');
        if (saved) setSelectedTheme(saved);
    }, []);

    const handleThemeSelect = (theme: Theme) => {
        setSelectedTheme(theme.id);
        applyTheme(theme);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 shadow-retro-xl max-w-2xl w-full mx-4 animate-scaleIn">
                {/* Header */}
                <div className="border-b-4 border-black dark:border-gray-400 p-4 flex items-center justify-between">
                    <h2 className="font-display text-lg">🎨 Theme Customizer</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="font-body text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Choose a Minecraft-inspired theme for your editor
                    </p>

                    {/* Theme Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(themes).map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeSelect(theme)}
                                className={`text-left p-4 border-4 transition-all duration-200 ${selectedTheme === theme.id
                                        ? 'border-black dark:border-white shadow-retro scale-105'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-display text-lg mb-2">{theme.name}</div>
                                <p className="font-body text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    {theme.description}
                                </p>

                                {/* Color Preview */}
                                <div className="flex gap-1">
                                    <div
                                        className="w-8 h-8 border-2 border-black"
                                        style={{ backgroundColor: theme.colors.primary }}
                                        title="Primary"
                                    />
                                    <div
                                        className="w-8 h-8 border-2 border-black"
                                        style={{ backgroundColor: theme.colors.secondary }}
                                        title="Secondary"
                                    />
                                    <div
                                        className="w-8 h-8 border-2 border-black"
                                        style={{ backgroundColor: theme.colors.accent }}
                                        title="Accent"
                                    />
                                    <div
                                        className="w-8 h-8 border-2 border-black"
                                        style={{ backgroundColor: theme.colors.background }}
                                        title="Background"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700">
                        <p className="font-body text-xs text-blue-800 dark:text-blue-300">
                            💡 <strong>Tip:</strong> Your theme preference is saved automatically. Try different themes to match your mood!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-4 border-black dark:border-gray-400 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-display border-4 border-black dark:border-white shadow-retro btn-lift transition-all duration-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemePicker;
