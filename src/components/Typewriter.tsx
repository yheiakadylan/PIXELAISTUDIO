import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    delay?: number;
    className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, delay = 50, className = '' }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, delay);

            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text, delay]);

    return <span className={className}>{displayedText}<span className="animate-pulse">|</span></span>;
};

export default Typewriter;
