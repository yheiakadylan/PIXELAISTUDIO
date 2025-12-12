import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Upscaler from 'upscaler';
import ToolLayout from '../components/layout/ToolLayout';
import { useFileSystem } from '../hooks/useFileSystem';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface ProcessedImage {
    id: string;
    file: File;
    preview: string;
    processed: boolean;
    originalCanvas?: HTMLCanvasElement;
    upscaledCanvas?: HTMLCanvasElement;
}

const Upscale: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<ProcessedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');
    const [scaleFactor, setScaleFactor] = useState<2 | 4>(2);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonImage, setComparisonImage] = useState<{ original: string; upscaled: string } | null>(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const { saveToFolder } = useFileSystem();
    const { injectDPI } = useDPIInjector();
    const upscalerRef = useRef<InstanceType<typeof Upscaler> | null>(null);

    // Initialize upscaler
    const getUpscaler = useCallback(() => {
        if (!upscalerRef.current) {
            upscalerRef.current = new Upscaler();
        }
        return upscalerRef.current;
    }, []);

    const handleProcess = async (files: File[]) => {
        setIsProcessing(true);
        const processedImages: ProcessedImage[] = [];
        const upscaler = getUpscaler();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setCurrentFile(file.name);
            setProcessingProgress(Math.round((i / files.length) * 100));

            try {
                // Load original image
                const originalCanvas = await imageToCanvas(file);

                // Upscale using AI - returns base64 string
                const upscaledDataURL = await upscaler.upscale(originalCanvas, {
                    patchSize: 64,
                    padding: 2,
                    progress: (progress: number) => {
                        const overallProgress = ((i + progress) / files.length) * 100;
                        setProcessingProgress(Math.round(overallProgress));
                    },
                }) as string;

                // Convert base64 to canvas
                const upscaledImg = new Image();
                await new Promise((resolve, reject) => {
                    upscaledImg.onload = resolve;
                    upscaledImg.onerror = reject;
                    upscaledImg.src = upscaledDataURL;
                });

                const upscaledCanvas = document.createElement('canvas');
                upscaledCanvas.width = upscaledImg.width;
                upscaledCanvas.height = upscaledImg.height;
                const upscaledCtx = upscaledCanvas.getContext('2d');
                if (upscaledCtx) {
                    upscaledCtx.drawImage(upscaledImg, 0, 0);
                }

                // Scale to target factor
                const targetWidth = originalCanvas.width * scaleFactor;
                const targetHeight = originalCanvas.height * scaleFactor;

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = targetWidth;
                finalCanvas.height = targetHeight;
                const ctx = finalCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(upscaledCanvas, 0, 0, targetWidth, targetHeight);
                }

                const preview = finalCanvas.toDataURL();

                processedImages.push({
                    id: `${file.name}-${Date.now()}`,
                    file,
                    preview,
                    processed: true,
                    originalCanvas,
                    upscaledCanvas: finalCanvas,
                });
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }

        setImages((prev) => [...prev, ...processedImages]);
        setIsProcessing(false);
        setProcessingProgress(0);
        setCurrentFile('');
    };

    const handleSaveAll = async () => {
        if (images.length === 0) return;

        try {
            const filesToSave: { blob: Blob; filename: string }[] = [];

            for (const img of images) {
                if (!img.upscaledCanvas) continue;

                const mimeType = `image/${format}`;
                let blob = await canvasToBlob(img.upscaledCanvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

                // Inject DPI if POD mode is enabled
                if (podMode && (format === 'png' || format === 'jpg')) {
                    blob = await injectDPI(blob, 300);
                }

                const extension = getExtensionFromMimeType(mimeType);
                const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseFilename}_upscaled_${scaleFactor}x.${extension}`;

                filesToSave.push({ blob, filename });
            }

            await saveToFolder(filesToSave);

            // Clear queue after successful save
            setImages([]);
        } catch (error) {
            console.error('Error saving files:', error);
        }
    };

    const handleShowComparison = useCallback((img: ProcessedImage) => {
        if (img.originalCanvas && img.upscaledCanvas) {
            setComparisonImage({
                original: img.originalCanvas.toDataURL(),
                upscaled: img.upscaledCanvas.toDataURL(),
            });
            setShowComparison(true);
            setSliderPosition(50);
        }
    }, []);

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
                title="⚡ UPSCALE 4K"
                description="AI enhancement to 4K quality using neural networks"
                onProcess={handleProcess}
                processedImages={images}
                onSaveAll={handleSaveAll}
            >
                {/* Processing Progress */}
                {isProcessing && (
                    <div className="nes-container is-warning shadow-hard mb-6">
                        <h3 className="text-lg mb-4 text-nes-yellow">⚡ Enhancing...</h3>
                        <div className="mb-4">
                            <progress
                                className="nes-progress is-warning"
                                value={processingProgress}
                                max="100"
                            />
                        </div>
                        <p className="text-sm text-center">
                            {processingProgress}% Complete
                        </p>
                        {currentFile && (
                            <p className="text-xs text-center mt-2 text-nes-gray">
                                Processing: {currentFile}
                            </p>
                        )}
                    </div>
                )}

                {/* Upscale Settings */}
                <div className="nes-container is-dark shadow-hard mb-6">
                    <h3 className="text-lg mb-4 text-nes-blue">⚙️ Upscale Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Scale Factor</label>
                            <div className="nes-select is-dark">
                                <select
                                    value={scaleFactor}
                                    onChange={(e) => setScaleFactor(Number(e.target.value) as 2 | 4)}
                                    disabled={isProcessing}
                                >
                                    <option value="2">2x (Double size)</option>
                                    <option value="4">4x (Quad size)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Output Format</label>
                            <div className="nes-select is-dark">
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                    disabled={isProcessing}
                                >
                                    <option value="png">PNG (Best quality)</option>
                                    <option value="jpg">JPG (Smaller size)</option>
                                    <option value="webp">WEBP (Modern)</option>
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
                                    disabled={isProcessing}
                                />
                                <span className="text-sm">POD Mode (300 DPI) {podMode && '✓'}</span>
                            </label>
                        </div>
                    </div>

                    {/* Performance Warning */}
                    <div className="p-4 border-2 border-nes-yellow">
                        <p className="text-sm text-nes-yellow mb-2">
                            ⚠️ <strong>Performance Note:</strong>
                        </p>
                        <ul className="text-xs text-nes-gray list-disc list-inside space-y-1">
                            <li>AI upscaling is memory-intensive (needs ~2GB RAM)</li>
                            <li>Large images may take 10-30 seconds each</li>
                            <li>First image loads the AI model (~3-5 seconds)</li>
                            <li>4x upscaling takes longer than 2x</li>
                        </ul>
                    </div>
                </div>

                {/* Preview Grid with Comparison */}
                {images.length > 0 && (
                    <div className="nes-container is-dark shadow-hard mb-6">
                        <h3 className="text-lg mb-4 text-nes-blue">🔍 Before & After</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {images.slice(0, 4).map((img) => (
                                <div
                                    key={img.id}
                                    className="border-4 border-white cursor-pointer hover:border-nes-blue transition-colors"
                                    onClick={() => handleShowComparison(img)}
                                >
                                    <div className="p-2">
                                        <img
                                            src={img.preview}
                                            alt="Upscaled preview"
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="text-center mt-2">
                                            <p className="text-xs text-nes-gray">
                                                {img.originalCanvas?.width} x {img.originalCanvas?.height} →{' '}
                                                {img.upscaledCanvas?.width} x {img.upscaledCanvas?.height}
                                            </p>
                                            <p className="text-xs text-nes-blue mt-1">Click to compare</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ToolLayout>

            {/* Comparison Modal */}
            {showComparison && comparisonImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-8"
                >
                    <div className="nes-container is-dark shadow-hard-lg max-w-6xl w-full">
                        <h3 className="text-xl mb-4 text-nes-blue">Before & After Comparison</h3>

                        {/* Comparison Slider */}
                        <div className="relative mb-6" style={{ height: '500px' }}>
                            <div className="absolute inset-0 overflow-hidden">
                                {/* After (Upscaled) - Full image */}
                                <img
                                    src={comparisonImage.upscaled}
                                    alt="Upscaled"
                                    className="absolute inset-0 w-full h-full object-contain"
                                />

                                {/* Before (Original) - Clipped by slider */}
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: `${sliderPosition}%` }}
                                >
                                    <img
                                        src={comparisonImage.original}
                                        alt="Original"
                                        className="absolute inset-0 w-full h-full object-contain"
                                        style={{ width: `${10000 / sliderPosition}%` }}
                                    />
                                </div>

                                {/* Slider Handle */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-nes-blue cursor-ew-resize"
                                    style={{ left: `${sliderPosition}%` }}
                                    onMouseDown={(e) => {
                                        const startX = e.clientX;
                                        const startPosition = sliderPosition;

                                        const handleMouseMove = (moveE: MouseEvent) => {
                                            const container = e.currentTarget.parentElement;
                                            if (!container) return;
                                            const rect = container.getBoundingClientRect();
                                            const deltaX = moveE.clientX - startX;
                                            const deltaPercent = (deltaX / rect.width) * 100;
                                            const newPosition = Math.max(0, Math.min(100, startPosition + deltaPercent));
                                            setSliderPosition(newPosition);
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                >
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-nes-blue border-4 border-white w-12 h-12 flex items-center justify-center">
                                        <span className="text-xl">⚔️</span>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="absolute top-4 left-4 bg-black bg-opacity-75 px-3 py-2 border-2 border-white">
                                    <p className="text-sm text-white">BEFORE</p>
                                </div>
                                <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-2 border-2 border-white">
                                    <p className="text-sm text-white">AFTER</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="nes-btn is-primary btn-pixel"
                                onClick={() => setShowComparison(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upscale;
