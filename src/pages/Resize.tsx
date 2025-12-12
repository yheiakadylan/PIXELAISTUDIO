import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolLayout from '../components/layout/ToolLayout';
import { useFileSystem } from '../hooks/useFileSystem';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, resizeCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface ProcessedImage {
    id: string;
    file: File;
    preview: string;
    processed: boolean;
    canvas?: HTMLCanvasElement;
    originalWidth: number;
    originalHeight: number;
}

interface Preset {
    name: string;
    width: number;
    height: number;
    description: string;
}

const PRESETS: Preset[] = [
    { name: 'Custom', width: 0, height: 0, description: 'Enter custom dimensions' },
    { name: 'Merch by Amazon', width: 4500, height: 5400, description: 'Standard T-Shirt' },
    { name: 'Etsy Listing', width: 2000, height: 2000, description: 'Square format' },
    { name: 'Mug 11oz', width: 2000, height: 800, description: 'Wrap-around design' },
    { name: 'Instagram Post', width: 1080, height: 1080, description: 'Square social media' },
    { name: 'Facebook Cover', width: 1200, height: 630, description: 'Cover photo' },
    { name: '4K Wallpaper', width: 3840, height: 2160, description: 'Ultra HD' },
];

const Resize: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<ProcessedImage[]>([]);
    const [selectedPreset, setSelectedPreset] = useState('Custom');
    const [width, setWidth] = useState(1000);
    const [height, setHeight] = useState(1000);
    const [lockAspectRatio, setLockAspectRatio] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(1);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const { saveToFolder } = useFileSystem();
    const { injectDPI } = useDPIInjector();

    const handleProcess = async (files: File[]) => {
        const processedImages: ProcessedImage[] = [];

        for (const file of files) {
            try {
                const canvas = await imageToCanvas(file);
                const preview = canvas.toDataURL();

                processedImages.push({
                    id: `${file.name}-${Date.now()}`,
                    file,
                    preview,
                    processed: false,
                    canvas,
                    originalWidth: canvas.width,
                    originalHeight: canvas.height,
                });
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }

        setImages((prev) => [...prev, ...processedImages]);
    };

    const handlePresetChange = useCallback((presetName: string) => {
        setSelectedPreset(presetName);
        const preset = PRESETS.find((p) => p.name === presetName);
        if (preset && preset.name !== 'Custom') {
            setWidth(preset.width);
            setHeight(preset.height);
            setAspectRatio(preset.width / preset.height);
            setLockAspectRatio(true);
        } else {
            setLockAspectRatio(false);
        }
    }, []);

    const handleWidthChange = useCallback(
        (newWidth: number) => {
            setWidth(newWidth);
            if (lockAspectRatio && aspectRatio > 0) {
                setHeight(Math.round(newWidth / aspectRatio));
            }
        },
        [lockAspectRatio, aspectRatio]
    );

    const handleHeightChange = useCallback(
        (newHeight: number) => {
            setHeight(newHeight);
            if (lockAspectRatio && aspectRatio > 0) {
                setWidth(Math.round(newHeight * aspectRatio));
            }
        },
        [lockAspectRatio, aspectRatio]
    );

    const handleSaveAll = async () => {
        if (images.length === 0) return;

        try {
            const filesToSave: { blob: Blob; filename: string }[] = [];

            for (const img of images) {
                if (!img.canvas) continue;

                // Resize canvas
                const resizedCanvas = resizeCanvas(img.canvas, width, height);

                const mimeType = `image/${format}`;
                let blob = await canvasToBlob(resizedCanvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

                // Inject DPI if POD mode is enabled
                if (podMode && (format === 'png' || format === 'jpg')) {
                    blob = await injectDPI(blob, 300);
                }

                const extension = getExtensionFromMimeType(mimeType);
                const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseFilename}_resized_${width}x${height}.${extension}`;

                filesToSave.push({ blob, filename });
            }

            await saveToFolder(filesToSave);

            // Clear queue after successful save
            setImages([]);
        } catch (error) {
            console.error('Error saving files:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Back Button */}
            <div className="flex-shrink-0 p-4 border-b-4 border-white">
                <button
                    className="nes-btn is-primary btn-pixel text-sm"
                    onClick={() => navigate('/')}
                >
                    ← Back to Home
                </button>
            </div>

            <ToolLayout
                title="🎨 RESIZE & PRESET"
                description="Scale images for POD platforms with quick presets"
                onProcess={handleProcess}
                processedImages={images}
                onSaveAll={handleSaveAll}
            >
                {/* Resize Controls */}
                <div className="nes-container is-dark shadow-hard mb-6">
                    <h3 className="text-lg mb-4 text-nes-blue">⚙️ Resize Settings</h3>

                    {/* Preset Selector */}
                    <div className="mb-6">
                        <label className="text-sm text-nes-gray mb-2 block">Quick Presets</label>
                        <div className="nes-select is-dark">
                            <select
                                value={selectedPreset}
                                onChange={(e) => handlePresetChange(e.target.value)}
                                className="w-full"
                            >
                                {PRESETS.map((preset) => (
                                    <option key={preset.name} value={preset.name}>
                                        {preset.name}
                                        {preset.description && ` - ${preset.description}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Width (px)</label>
                            <input
                                type="number"
                                className="nes-input is-dark w-full"
                                value={width}
                                onChange={(e) => handleWidthChange(Number(e.target.value))}
                                min="1"
                                max="10000"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Height (px)</label>
                            <input
                                type="number"
                                className="nes-input is-dark w-full"
                                value={height}
                                onChange={(e) => handleHeightChange(Number(e.target.value))}
                                min="1"
                                max="10000"
                            />
                        </div>
                    </div>

                    {/* Aspect Ratio Lock */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="nes-checkbox is-dark"
                                checked={lockAspectRatio}
                                onChange={(e) => {
                                    setLockAspectRatio(e.target.checked);
                                    if (e.target.checked && width > 0 && height > 0) {
                                        setAspectRatio(width / height);
                                    }
                                }}
                            />
                            <span className="text-sm">
                                Lock Aspect Ratio {lockAspectRatio && '🔒'}
                            </span>
                        </label>
                    </div>

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Output Format</label>
                            <div className="nes-select is-dark">
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                >
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPG</option>
                                    <option value="webp">WEBP</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">DPI Setting</label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="nes-checkbox is-dark"
                                    checked={podMode}
                                    onChange={(e) => setPodMode(e.target.checked)}
                                />
                                <span className="text-sm">
                                    POD Mode (300 DPI) {podMode && '✓'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Preview Info */}
                    <div className="mt-6 p-4 border-2 border-nes-blue">
                        <p className="text-sm text-nes-blue mb-2">
                            📐 <strong>Output:</strong> {width} x {height} px
                        </p>
                        <p className="text-xs text-nes-gray">
                            {images.length > 0 && (
                                <>
                                    Original: {images[0].originalWidth} x {images[0].originalHeight} px
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </ToolLayout>
        </div>
    );
};

export default Resize;
