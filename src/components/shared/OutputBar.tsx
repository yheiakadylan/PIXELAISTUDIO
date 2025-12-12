import React from 'react';

interface OutputBarProps {
    format: 'png' | 'jpg' | 'webp';
    onFormatChange: (format: 'png' | 'jpg' | 'webp') => void;
    podMode: boolean;
    onPodModeChange: (enabled: boolean) => void;
    onSaveAll: () => void;
    itemCount: number;
    disabled?: boolean;
}

const OutputBar: React.FC<OutputBarProps> = ({
    format,
    onFormatChange,
    podMode,
    onPodModeChange,
    onSaveAll,
    itemCount,
    disabled = false,
}) => {
    return (
        <div className="nes-container is-dark shadow-hard mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left side: Settings */}
                <div className="flex flex-wrap items-center gap-6">
                    {/* Format Selector */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-nes-gray">Format:</label>
                        <div className="nes-select is-dark">
                            <select
                                value={format}
                                onChange={(e) => onFormatChange(e.target.value as 'png' | 'jpg' | 'webp')}
                                disabled={disabled}
                                className="text-sm"
                            >
                                <option value="png">PNG</option>
                                <option value="jpg">JPG</option>
                                <option value="webp">WEBP</option>
                            </select>
                        </div>
                    </div>

                    {/* POD Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-nes-gray">POD Mode:</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="nes-checkbox is-dark"
                                checked={podMode}
                                onChange={(e) => onPodModeChange(e.target.checked)}
                                disabled={disabled}
                            />
                            <span className="text-sm">
                                {podMode ? (
                                    <span className="text-nes-green">300 DPI ✓</span>
                                ) : (
                                    <span className="text-nes-gray">72 DPI</span>
                                )}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Right side: Save Button */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-nes-gray">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <button
                        className="nes-btn is-success btn-pixel"
                        onClick={onSaveAll}
                        disabled={disabled || itemCount === 0}
                    >
                        💚 Loot Items
                    </button>
                </div>
            </div>

            {/* Info Text */}
            {podMode && (
                <div className="mt-4 p-3 border-2 border-nes-green">
                    <p className="text-xs text-nes-green">
                        ⚠️ POD Mode Active: Images will be exported at 300 DPI for print quality
                    </p>
                </div>
            )}
        </div>
    );
};

export default OutputBar;
