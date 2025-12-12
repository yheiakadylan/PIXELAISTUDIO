import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CraftModal from '../components/CraftModal';
import PixelCharacter from '../components/PixelCharacter';
import FloatingClouds from '../components/FloatingClouds';
import CursorTrail from '../components/CursorTrail';
import AchievementPopup, { useAchievements } from '../components/AchievementPopup';
import MinecraftSword from '../components/MinecraftSword';
import Typewriter from '../components/Typewriter';
import StatsCounter from '../components/StatsCounter';
import { soundEffects } from '../utils/soundEffects';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [showCraftModal, setShowCraftModal] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [logoClicks, setLogoClicks] = useState(0);
    const [sKeyPresses, setSKeyPresses] = useState(0);
    const [superMode, setSuperMode] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const { currentAchievement, unlockAchievement, clearCurrentAchievement } = useAchievements();

    useEffect(() => {
        // Check for saved dark mode preference
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
        if (savedMode) {
            document.documentElement.classList.add('dark');
        }

        // Super Mode activation: Press "S" 3 times
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 's') {
                const newCount = sKeyPresses + 1;
                setSKeyPresses(newCount);

                if (newCount >= 3) {
                    setSuperMode(true);
                    unlockAchievement('super_master');
                    setSKeyPresses(0);

                    // Show for 10 seconds
                    setTimeout(() => setSuperMode(false), 10000);
                }

                // Reset after 2 seconds if not completed
                setTimeout(() => setSKeyPresses(0), 2000);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sKeyPresses]);

    // Show title after a short delay
    useEffect(() => {
        const timer = setTimeout(() => setShowTitle(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', String(newMode));
        document.documentElement.classList.toggle('dark');
    };

    const tools = [
        {
            title: 'Resize',
            description: 'Adjust image dimensions while maintaining quality. Perfect for social media, web, or print.',
            icon: 'photo_size_select_large',
            iconBg: 'bg-blue-100 dark:bg-blue-900',
            iconBorder: 'border-blue-500',
            iconColor: 'text-blue-600 dark:text-blue-400',
            hoverBg: 'group-hover:bg-blue-500',
            badge: 'ESSENTIAL',
            badgeBg: 'bg-blue-500',
            badgeRotate: '-rotate-2',
            path: '/resize',
        },
        {
            title: 'Convert',
            description: 'Transform between formats (PNG, JPG, WebP, etc.) with optional quality and DPI settings.',
            icon: 'sync_alt',
            iconBg: 'bg-green-100 dark:bg-green-900',
            iconBorder: 'border-green-500',
            iconColor: 'text-green-600 dark:text-green-400',
            hoverBg: 'group-hover:bg-green-500',
            badge: 'POPULAR',
            badgeBg: 'bg-green-500',
            badgeRotate: 'rotate-1',
            path: '/convert',
        },
        {
            title: 'Remove Background',
            description: 'AI-powered background removal. Perfect for creating clean assets and product shots.',
            icon: 'content_cut',
            iconBg: 'bg-purple-100 dark:bg-purple-900',
            iconBorder: 'border-purple-500',
            iconColor: 'text-purple-600 dark:text-purple-400',
            hoverBg: 'group-hover:bg-purple-500',
            badge: 'AI TOOL',
            badgeBg: 'bg-purple-500',
            badgeRotate: 'rotate-2',
            path: '/rembg',
        },
        {
            title: 'Image Upscaler',
            description: 'Enhance resolution up to 8x with AI. Real-ESRGAN for photos and anime.',
            icon: 'photo_filter',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900',
            iconBorder: 'border-yellow-500',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            hoverBg: 'group-hover:bg-yellow-500',
            badge: 'NEW',
            badgeBg: 'bg-red-500',
            badgeRotate: '-rotate-1',
            path: '/upscale',
        },
    ];

    return (
        <div className="min-h-screen bg-retro-bg dark:bg-retro-bg-dark transition-theme flex flex-col font-body text-xl text-gray-900 dark:text-gray-100 animate-fadeIn">
            {/* Background Pattern */}
            <div className="fixed inset-0 -z-10 bg-[linear-gradient(45deg,#c4c4c4_25%,transparent_25%,transparent_75%,#c4c4c4_75%,#c4c4c4),linear-gradient(45deg,#c4c4c4_25%,transparent_25%,transparent_75%,#c4c4c4_75%,#c4c4c4)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222),linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222)]" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b-4 border-black dark:border-gray-500 transition-theme">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-12 h-12 bg-blue-600 border-4 border-black dark:border-white flex items-center justify-center text-white shadow-retro dark:shadow-none hover:translate-x-1 hover:translate-y-1 hover:shadow-retro-active transition-all duration-200 cursor-pointer animate-bounceIn ${superMode ? 'animate-spin-slow' : ''}`}
                                onClick={() => {
                                    const newClicks = logoClicks + 1;
                                    setLogoClicks(newClicks);
                                    soundEffects.click();
                                    if (newClicks === 10) {
                                        unlockAchievement('logo_lover');
                                        soundEffects.success();
                                        setLogoClicks(0);
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                            </div>
                            <span className="font-display text-xs md:text-sm tracking-tighter leading-tight mt-1 animate-slideInLeft">
                                Pixel AI<br />Studio
                            </span>
                        </div>
                        <div className="flex items-center gap-4 animate-slideInRight">
                            <button
                                className="p-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
                                onClick={() => {
                                    soundEffects.toggle();
                                    setSoundEnabled(!soundEnabled);
                                    soundEffects.click();
                                }}
                                title="Toggle Sound"
                            >
                                <span className="material-symbols-outlined">
                                    {soundEnabled ? 'volume_up' : 'volume_off'}
                                </span>
                            </button>
                            <button
                                className="p-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
                                onClick={toggleDarkMode}
                            >
                                {darkMode ? (
                                    <span className="material-symbols-outlined">light_mode</span>
                                ) : (
                                    <span className="material-symbols-outlined">dark_mode</span>
                                )}
                            </button>
                            <button
                                className="hidden sm:inline-flex items-center justify-center px-6 py-3 border-4 border-black dark:border-white text-xs font-display text-white bg-green-600 hover:bg-green-500 shadow-retro btn-lift transition-all duration-200"
                                onClick={() => {
                                    setShowCraftModal(true);
                                    soundEffects.click();
                                }}
                            >
                                Start Crafting
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <div className="inline-flex items-center px-4 py-2 bg-yellow-300 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 text-lg font-bold border-4 border-black dark:border-yellow-600 mb-8 shadow-retro animate-slideInDown">
                        <span className="w-3 h-3 bg-red-600 mr-3 animate-pulse-fast border-2 border-black"></span>
                        100% Client-Side
                    </div>
                    {/* UPDATED: Uses utility classes instead of arbitrary values */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display leading-normal mb-6 text-shadow dark:text-shadow-light">
                        {showTitle ? (
                            <>
                                <Typewriter text="Build Better Images" delay={80} />
                                <br />
                                <span className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 box-decoration-clone">
                                    <Typewriter text="With AI Blocks" delay={80} />
                                </span>
                            </>
                        ) : (
                            <span className="opacity-0">Loading...</span>
                        )}
                    </h1>
                    <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-body bg-white/80 dark:bg-black/40 p-4 border-2 border-dashed border-gray-500 transition-theme animate-slideInUp">
                        Enhance, resize, and transform your assets directly in your browser. No uploads, full privacy, and blazing fast performance.
                    </p>
                </div>

                {/* Stats Counter */}
                <StatsCounter className="max-w-2xl w-full mx-auto mb-12 animate-scaleIn" />

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
                    {tools.map((tool, index) => (
                        <div
                            key={tool.path}
                            className="stagger-item group relative bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-gray-400 shadow-retro dark:shadow-retro-dark hover:shadow-retro-hover hover:-translate-y-1 active:shadow-retro-active active:translate-x-1 active:translate-y-1 transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(tool.path)}
                            style={{ animationDelay: `${100 + index * 100}ms` }}
                        >
                            {/* Badge */}
                            <div
                                className={`absolute -top-4 -right-4 ${tool.badgeBg} border-4 border-black text-white px-3 py-1 font-display text-xs ${tool.badgeRotate} group-hover:rotate-0 group-hover:scale-110 transition-all duration-300`}
                            >
                                {tool.badge}
                            </div>

                            {/* Icon and Arrow */}
                            <div className="flex items-start justify-between mb-6">
                                <div
                                    className={`p-3 ${tool.iconBg} border-4 ${tool.iconBorder} ${tool.iconColor} ${tool.hoverBg} group-hover:text-white transition-all duration-300 group-hover:scale-110`}
                                >
                                    <span className="material-symbols-outlined text-4xl">{tool.icon}</span>
                                </div>
                                <div className="border-2 border-gray-300 p-1 group-hover:border-black dark:group-hover:border-white transition-all duration-200 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-display text-gray-900 dark:text-white mb-3">{tool.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xl leading-snug">{tool.description}</p>
                        </div>
                    ))}
                </div>

                {/* Features Bar */}
                <div className="mt-20 w-full max-w-6xl animate-slideInUp" style={{ animationDelay: '600ms' }}>
                    <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-500 p-6 flex flex-wrap justify-around items-center gap-6 shadow-retro transition-theme">
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform duration-200">
                            <span className="material-symbols-outlined text-green-600 text-2xl">lock</span>
                            <span className="font-display text-xs">Local Privacy</span>
                        </div>
                        <div className="hidden md:block w-1 h-8 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform duration-200">
                            <span className="material-symbols-outlined text-blue-600 text-2xl">wifi_off</span>
                            <span className="font-display text-xs">Offline Mode</span>
                        </div>
                        <div className="hidden md:block w-1 h-8 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform duration-200">
                            <span className="material-symbols-outlined text-purple-600 text-2xl">print</span>
                            <span className="font-display text-xs">Print Ready</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-4 border-black dark:border-gray-500 bg-white dark:bg-gray-900 py-10 transition-theme">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-body">
                        © 2026 Pixel AI Studio. Crafted with <span className="text-red-500 font-bold animate-pulse">❤</span> by HaiTrinh.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-display opacity-80">
                        <span className="material-symbols-outlined text-base">memory</span>
                        HaiTrinh
                    </div>
                </div>
            </footer>

            {/* Craft Modal */}
            <CraftModal
                isOpen={showCraftModal}
                onClose={() => setShowCraftModal(false)}
            />

            {/* Animated Character */}
            <PixelCharacter />

            {/* Floating Clouds */}
            <FloatingClouds />

            {/* Cursor Trail */}
            {!superMode && <CursorTrail />}

            {/* Minecraft Sword Click Effect */}
            <MinecraftSword />

            {/* Achievement Popup */}
            <AchievementPopup
                achievement={currentAchievement}
                onClose={clearCurrentAchievement}
            />
        </div>
    );
};

export default Home;