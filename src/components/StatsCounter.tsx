import React, { useState, useEffect } from 'react';

interface StatsCounterProps {
    className?: string;
}

interface Stats {
    imagesProcessed: number;
    timesSaved: number;
    downloads: number;
}

const StatsCounter: React.FC<StatsCounterProps> = ({ className = '' }) => {
    const [displayStats, setDisplayStats] = useState<Stats>({ imagesProcessed: 0, timesSaved: 0, downloads: 0 });

    useEffect(() => {
        // Load stats from localStorage
        const saved = localStorage.getItem('pixelAIStats');
        if (saved) {
            const parsedStats = JSON.parse(saved);

            // Animate count-up
            animateValue('imagesProcessed', 0, parsedStats.imagesProcessed, 1000);
            animateValue('timesSaved', 0, parsedStats.timesSaved, 1200);
            animateValue('downloads', 0, parsedStats.downloads, 1400);
        }
    }, []);

    const animateValue = (key: keyof Stats, start: number, end: number, duration: number) => {
        const range = end - start;
        const increment = range / (duration / 16); // 60fps
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            setDisplayStats(prev => ({ ...prev, [key]: Math.floor(current) }));
        }, 16);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark transition-theme ${className}`}>
            <h3 className="font-display text-lg mb-4 text-center">📊 Your Stats</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-3xl font-display text-blue-600 dark:text-blue-400 mb-1 animate-pulse">
                        {displayStats.imagesProcessed}
                    </div>
                    <div className="text-xs font-body text-gray-600 dark:text-gray-400">Images Processed</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-display text-green-600 dark:text-green-400 mb-1 animate-pulse" style={{ animationDelay: '200ms' }}>
                        {displayStats.timesSaved}m
                    </div>
                    <div className="text-xs font-body text-gray-600 dark:text-gray-400">Time Saved</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-display text-purple-600 dark:text-purple-400 mb-1 animate-pulse" style={{ animationDelay: '400ms' }}>
                        {displayStats.downloads}
                    </div>
                    <div className="text-xs font-body text-gray-600 dark:text-gray-400">Downloads</div>
                </div>
            </div>
        </div>
    );
};

// Helper functions to update stats
export const incrementStat = (key: keyof Stats, amount: number = 1) => {
    const saved = localStorage.getItem('pixelAIStats');
    const stats = saved ? JSON.parse(saved) : { imagesProcessed: 0, timesSaved: 0, downloads: 0 };
    stats[key] += amount;
    localStorage.setItem('pixelAIStats', JSON.stringify(stats));
};

export default StatsCounter;
