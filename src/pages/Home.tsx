import React from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPWA from '../components/shared/InstallPWA';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const tools = [
        {
            title: 'RESIZE & PRESET',
            description: 'Scale images for POD platforms',
            color: 'is-primary',
            icon: '🎨',
            path: '/resize',
            comingSoon: true,
        },
        {
            title: 'FORMAT CONVERT',
            description: 'Convert PNG/JPG/WEBP formats',
            color: 'is-success',
            icon: '🔄',
            path: '/convert',
            comingSoon: false,
        },
        {
            title: 'REMOVE BG',
            description: 'AI-powered background removal',
            color: 'is-warning',
            icon: '✂️',
            path: '/rembg',
            comingSoon: true,
        },
        {
            title: 'UPSCALE 4K',
            description: 'AI enhancement to 4K quality',
            color: 'is-error',
            icon: '⚡',
            path: '/upscale',
            comingSoon: true,
        },
    ];

    return (
        <div className="fixed inset-0 w-full h-full bg-nes-dark flex flex-col overflow-hidden">
            {/* Header - Compact and Clean */}
            <header className="flex justify-between items-center px-8 py-6 border-b-4 border-white bg-nes-dark shadow-hard">
                <div className="flex items-center gap-6">
                    <div style={{ fontSize: '48px', lineHeight: '1' }}>🕹️</div>
                    <div>
                        <h1 className="text-3xl text-nes-blue leading-tight">
                            PIXEL AI STUDIO
                        </h1>
                        <p className="text-sm text-nes-gray mt-2">
                            Client-side AI Image Tool
                        </p>
                    </div>
                </div>
                <InstallPWA />
            </header>

            {/* Main Content - Perfectly Centered 2x2 Grid */}
            <main className="flex-1 flex items-center justify-center p-10 overflow-hidden">
                <div className="w-full max-w-6xl h-full max-h-[700px] flex items-center justify-center">
                    {/* Tool Cards Grid - Always 2x2 */}
                    <div
                        className="grid gap-8 w-full h-full"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gridTemplateRows: 'repeat(2, 1fr)',
                        }}
                    >
                        {tools.map((tool, index) => (
                            <div
                                key={index}
                                className={`nes-container ${tool.color} shadow-hard-lg cursor-pointer btn-pixel transform transition-all duration-200 hover:scale-105 flex items-center justify-center`}
                                onClick={() => !tool.comingSoon && navigate(tool.path)}
                                style={{
                                    animationDelay: `${index * 0.1}s`,
                                }}
                            >
                                <div className="text-center w-full py-4">
                                    <div
                                        className="mb-6 animate-bounce-pixel inline-block"
                                        style={{ fontSize: '80px', lineHeight: '1' }}
                                    >
                                        {tool.icon}
                                    </div>
                                    <h2 className="text-2xl mb-4 tracking-wide font-bold">{tool.title}</h2>
                                    <p className="text-sm mb-6 text-white opacity-90 px-6 leading-relaxed">
                                        {tool.description}
                                    </p>
                                    {tool.comingSoon && (
                                        <div className="inline-block">
                                            <span className="nes-badge is-splited">
                                                <span className="is-dark">Status</span>
                                                <span className="is-warning">Coming Soon</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer - Compact and Informative */}
            <footer className="flex-shrink-0 border-t-4 border-white px-8 py-5 bg-nes-dark shadow-hard">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap justify-center items-center gap-8 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span style={{ fontSize: '20px' }}>🔒</span>
                            <span className="text-nes-green font-bold">100% Client-Side</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span style={{ fontSize: '20px' }}>📴</span>
                            <span className="text-nes-green font-bold">Works Offline</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span style={{ fontSize: '20px' }}>🎯</span>
                            <span className="text-nes-green font-bold">POD Ready (300 DPI)</span>
                        </div>
                    </div>
                    <div className="text-center text-xs text-nes-gray">
                        Made with 💚 by Pixel Artists • Powered by WebAssembly & AI
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
