import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolLayout from '../components/layout/ToolLayout';
import ProgressSteps from '../components/shared/ProgressSteps';
import Tooltip from '../components/shared/Tooltip';
import EmptyState from '../components/shared/EmptyState';
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
    icon: string;
}

const PRESETS: Preset[] = [
    { name: 'Custom', width: 0, height: 0, description: 'Enter custom dimensions', icon: '✏️' },
    { name: 'Merch by Amazon', width: 4500, height: 5400, description: 'Standard T-Shirt', icon: '👕' },
    { name: 'Etsy Listing', width: 2000, height: 2000, description: 'Square format', icon: '📦' },
    { name: 'Mug 11oz', width: 2000, height: 800, description: 'Wrap-around design', icon: '☕' },
    { name: 'Instagram Post', width: 1080, height: 1080, description: 'Square social media', icon: '📱' },
    { name: 'Facebook Cover', width: 1200, height: 630, description: 'Cover photo', icon: '🖼️' },
    { name: '4K Wallpaper', width: 3840, height: 2160, description: 'Ultra HD', icon: '🖥️' },
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
    const [currentStep, setCurrentStep] = useState(1);
    const { saveToFolder } = useFileSystem();
    const { injectDPI } = useDPIInjector();

    const steps = [
        { number: 1, label: 'Upload', status: currentStep > 1 ? 'completed' as const : currentStep === 1 ? 'active' as const : 'pending' as const },
        { number: 2, label: 'Configure', status: currentStep > 2 ? 'completed' as const : currentStep === 2 ? 'active' as const : 'pending' as const },
        { number: 3, label: 'Process', status: currentStep > 3 ? 'completed' as const : currentStep === 3 ? 'active' as const : 'pending' as const },
        { number: 4, label: 'Download', status: currentStep === 4 ? 'active' as const : 'pending' as const },
    ];

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
        setCurrentStep(2); // Move to Configure step
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

    const handleApplyResize = async () => {
        setCurrentStep(3); // Processing

        const updatedImages = await Promise.all(
            images.map(async (img) => {
                if (!img.canvas) return img;
                const resizedCanvas = resizeCanvas(img.canvas, width, height);
                return { ...img, canvas: resizedCanvas, processed: true };
            })
        );

        setImages(updatedImages);
        setCurrentStep(4); // Download ready
    };

    const handleSaveAll = async () => {
        if (images.length === 0) return;

        try {
            const filesToSave: { blob: Blob; filename: string }[] = [];

            for (const img of images) {
                if (!img.canvas) continue;

                const mimeType = `image/${format}`;
                let blob = await canvasToBlob(img.canvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

                if (podMode && (format === 'png' || format === 'jpg')) {
                    blob = await injectDPI(blob, 300);
                }

                const extension = getExtensionFromMimeType(mimeType);
                const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseFilename}_resized_${width}x${height}.${extension}`;

                filesToSave.push({ blob, filename });
            }

            await saveToFolder(filesToSave);
            setImages([]);
            setCurrentStep(1); // Reset to start
        } catch (error) {
            console.error('Error saving files:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b-4 border-white flex items-center justify-between">
                <button className="nes-btn is-primary btn-pixel text-sm" onClick={() => navigate('/')}>
                    ← Back
                </button>
                <h2 className="text-xl">🎨 Resize & Preset</h2>
                <Tooltip text="Resize images with POD presets or custom dimensions">
                    <span className="text-2xl cursor-help">❓</span>
                </Tooltip>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Progress Steps */}
                    <ProgressSteps steps={steps} />

                    {/* Step 1: Upload */}
                    {currentStep === 1 && (
                        <ToolLayout
                            title=""
                            description=""
                            onProcess={handleProcess}
                            processedImages={[]}
                            onSaveAll={() => { }}
                        >
                            <EmptyState
                                icon="📁"
                                title="Upload Your Images"
                                description="Drag and drop images here, or click to browse. Supports PNG, JPG, WEBP."
                                actionLabel="Choose Files"
                                onAction={() => document.getElementById('file-input')?.click()}
                            />
                        </ToolLayout>
                    )}

                    {/* Step 2: Configure */}
                    {currentStep === 2 && images.length > 0 && (
                        <>
                            {/* Preset Grid */}
                            <div className="nes-container is-dark shadow-hard mb-6">
                                <h3 className="text-lg mb-4 text-nes-blue">📐 Choose Preset or Custom Size</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {PRESETS.map((preset) => (
                                        <div
                                            key={preset.name}
                                            className={`
                        border-4 p-4 cursor-pointer transition-all text-center
                        ${selectedPreset === preset.name ? 'border-nes-blue bg-nes-blue bg-opacity-20' : 'border-white hover:border-nes-gray'}
                      `}
                                            onClick={() => handlePresetChange(preset.name)}
                                        >
                                            <div className="text-4xl mb-2">{preset.icon}</div>
                                            <div className="text-sm font-bold mb-1">{preset.name}</div>
                                            {preset.width > 0 && (
                                                <div className="text-xs text-nes-gray">{preset.width} x {preset.height}</div>
                                            )}
                                            <div className="text-xs text-nes-gray mt-1">{preset.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div className="nes-container is-dark shadow-hard mb-6">
                                <h3 className="text-lg mb-4 text-nes-blue">📏 Dimensions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm text-nes-gray mb-2 block flex items-center gap-2">
                                            Width (px)
                                            <Tooltip text="Target width in pixels">
                                                <span className="text-xs">❓</span>
                                            </Tooltip>
                                        </label>
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
                                        <label className="text-sm text-nes-gray mb-2 block flex items-center gap-2">
                                            Height (px)
                                            <Tooltip text="Target height in pixels">
                                                <span className="text-xs">❓</span>
                                            </Tooltip>
                                        </label>
                                        <input
                                            type="number"
                                            className="nes-input is-dark w-full"
                                            value={height}
                                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                                            min="1"
                                            max="10000"
                                        />
                                    </div>

                                    <div className="flex items-end">
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
                                            <span className="text-sm">Lock Ratio {lockAspectRatio && '🔒'}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="p-4 border-2 border-nes-blue">
                                    <p className="text-sm text-nes-blue mb-2">
                                        📐 <strong>Output:</strong> {width} x {height} px
                                    </p>
                                    <p className="text-xs text-nes-gray">
                                        Original: {images[0].originalWidth} x {images[0].originalHeight} px
                                    </p>
                                </div>
                            </div>

                            {/* Output Settings */}
                            <div className="nes-container is-dark shadow-hard mb-6">
                                <h3 className="text-lg mb-4 text-nes-blue">⚙️ Output Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-nes-gray mb-2 block">Format</label>
                                        <div className="nes-select is-dark">
                                            <select value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}>
                                                <option value="png">PNG (Best quality)</option>
                                                <option value="jpg">JPG (Smaller size)</option>
                                                <option value="webp">WEBP (Modern)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-nes-gray mb-2 block flex items-center gap-2">
                                            POD Mode
                                            <Tooltip text="Enable 300 DPI for print-on-demand quality">
                                                <span className="text-xs">❓</span>
                                            </Tooltip>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="nes-checkbox is-dark"
                                                checked={podMode}
                                                onChange={(e) => setPodMode(e.target.checked)}
                                            />
                                            <span className="text-sm">{podMode ? '300 DPI ✓' : '72 DPI'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="nes-btn is-success btn-pixel w-full text-lg"
                                onClick={handleApplyResize}
                            >
                                Apply Resize to {images.length} Image{images.length !== 1 && 's'} →
                            </button>
                        </>
                    )}

                    {/* Step 3: Processing */}
                    {currentStep === 3 && (
                        <div className="nes-container is-warning shadow-hard text-center py-12">
                            <div className="text-6xl mb-4">⚙️</div>
                            <h3 className="text-xl mb-2">Processing...</h3>
                            <p className="text-sm text-nes-gray">Resizing your images</p>
                        </div>
                    )}

                    {/* Step 4: Download */}
                    {currentStep === 4 && images.length > 0 && (
                        <>
                            <div className="nes-container is-success shadow-hard mb-6 text-center">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-xl mb-2">Ready to Download!</h3>
                                <p className="text-sm text-nes-gray mb-4">
                                    {images.length} image{images.length !== 1 && 's'} resized to {width} x {height}
                                </p>
                                <button
                                    className="nes-btn is-success btn-pixel text-lg"
                                    onClick={handleSaveAll}
                                >
                                    💚 Download All ({images.length})
                                </button>
                            </div>

                            {/* Preview Grid */}
                            <div className="nes-container is-dark shadow-hard">
                                <h3 className="text-lg mb-4 text-nes-blue">Preview</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {images.slice(0, 8).map((img) => (
                                        <div key={img.id} className="border-2 border-white p-2">
                                            <img src={img.preview} alt="Preview" className="w-full h-32 object-cover mb-2" />
                                            <p className="text-xs text-nes-gray truncate">{img.file.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Resize;
