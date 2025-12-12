import React, { useState } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="cursor-help"
            >
                {children}
            </div>
            {show && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                    <div className="nes-container is-dark shadow-hard text-xs whitespace-nowrap px-3 py-2">
                        {text}
                    </div>
                    <div className="w-3 h-3 bg-nes-dark border-4 border-white absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 rotate-45" />
                </div>
            )}
        </div>
    );
};

export default Tooltip;
