import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolLayout from '../components/layout/ToolLayout';
import { useFileSystem } from '../hooks/useFileSystem';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';
import { removeBackground } from '@imgly/background-removal';

interface ProcessedImage {
    id: string;
    file: File;
    preview: string;
    processed: boolean;
    canvas?: HTMLCanvasElement;
    originalCanvas?: HTMLCanvasElement;
}

const Rembg: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<ProcessedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { saveToFolder } = useFileSystem();
    const { injectDPI } = useDPIInjector();

    const handleProcess = async (files: File[]) => {
        setIsProcessing(true);
        const processedImages: ProcessedImage[] = [];
        let completed = 0;

        for (const file of files) {
            try {
                // Load original image
                const originalCanvas = await imageToCanvas(file);

                // Remove background using AI
                const blob = await removeBackground(file, {
                    progress: (_key: string, current: number, total: number) => {
                        const fileProgress = (current / total) * 100;
                        const overallProgress = ((completed + fileProgress / 100) / files.length) * 100;
                        setProcessingProgress(Math.round(overallProgress));
                    },
                });

                // Convert result to canvas
                const url = URL.createObjectURL(blob);
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                }
                URL.revokeObjectURL(url);

                const preview = canvas.toDataURL();

                processedImages.push({
                    id: `${file.name}-${Date.now()}`,
                    file,
                    preview,
                    processed: true,
                    canvas,
                    originalCanvas,
                });

                completed++;
                setProcessingProgress(Math.round((completed / files.length) * 100));
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                completed++;
            }
        }

        setImages((prev) => [...prev, ...processedImages]);
        setIsProcessing(false);
        setProcessingProgress(0);
    };

    const handleSaveAll = async () => {
        if (images.length === 0) return;

        try {
            const filesToSave: { blob: Blob; filename: string }[] = [];

            for (const img of images) {
                if (!img.canvas) continue;

                const mimeType = `image/${format}`;
                let blob = await canvasToBlob(img.canvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

                // Inject DPI if POD mode is enabled
                if (podMode && (format === 'png' || format === 'jpg')) {
                    blob = await injectDPI(blob, 300);
                }

                const extension = getExtensionFromMimeType(mimeType);
                const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseFilename}_nobg.${extension}`;

                filesToSave.push({ blob, filename });
            }

            await saveToFolder(filesToSave);

            // Clear queue after successful save
            setImages([]);
        } catch (error) {
            console.error('Error saving files:', error);
        }
    };

    const handlePreview = useCallback((imagePreview: string) => {
        setPreviewImage(imagePreview);
        setShowPreview(true);
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
                title="✂️ REMOVE BG"
                description="AI-powered background removal running in your browser"
                onProcess={handleProcess}
                processedImages={images}
                onSaveAll={handleSaveAll}
            >
                {/* Processing Progress */}
                {isProcessing && (
                    <div className="nes-container is-warning shadow-hard mb-6">
                        <h3 className="text-lg mb-4 text-nes-yellow">🎮 Crafting...</h3>
                        <div className="mb-4">
                            <progress
                                className="nes-progress is-warning"
                                value={processingProgress}
                                max="100"
                            />
                        </div>
                        <p className="text-sm text-center">
                            {processingProgress}% Complete - AI is removing backgrounds
                        </p>
                    </div>
                )}

                {/* Output Settings */}
                <div className="nes-container is-dark shadow-hard mb-6">
                    <h3 className="text-lg mb-4 text-nes-blue">⚙️ Output Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Output Format</label>
                            <div className="nes-select is-dark">
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                    disabled={isProcessing}
                                >
                                    <option value="png">PNG (Recommended for transparency)</option>
                                    <option value="webp">WEBP (Smaller size)</option>
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
                                <span className="text-sm">
                                    POD Mode (300 DPI) {podMode && '✓'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 border-2 border-nes-blue">
                        <p className="text-sm text-nes-blue mb-2">
                            💡 <strong>Tips:</strong>
                        </p>
                        <ul className="text-xs text-nes-gray list-disc list-inside space-y-1">
                            <li>PNG preserves transparency perfectly</li>
                            <li>AI processing happens on your device (no upload)</li>
                            <li>First image may take longer (loading AI model)</li>
                            <li>Works best with clear subject and contrasting background</li>
                        </ul>
                    </div>
                </div>

                {/* Preview Images with Transparent Background Check */}
                {images.length > 0 && (
                    <div className="nes-container is-dark shadow-hard mb-6">
                        <h3 className="text-lg mb-4 text-nes-blue">👁️ Preview on Transparent</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.slice(0, 6).map((img) => (
                                <div
                                    key={img.id}
                                    className="border-4 border-white cursor-pointer hover:border-nes-blue transition-colors"
                                    onClick={() => handlePreview(img.preview)}
                                >
                                    <div className="checkerboard p-4">
                                        <img
                                            src={img.preview}
                                            alt="Preview"
                                            className="w-full h-32 object-contain"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-nes-gray mt-4 text-center">
                            Click image to view large preview
                        </p>
                    </div>
                )}
            </ToolLayout>

            {/* Preview Modal */}
            {showPreview && previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="nes-container is-dark shadow-hard-lg max-w-4xl max-h-full overflow-auto">
                        <h3 className="text-xl mb-4 text-nes-blue">Transparency Preview</h3>
                        <div className="checkerboard p-8 mb-4">
                            <img
                                src={previewImage}
                                alt="Large preview"
                                className="w-full h-auto object-contain max-h-96"
                            />
                        </div>
                        <div className="text-center">
                            <button
                                className="nes-btn is-primary btn-pixel"
                                onClick={() => setShowPreview(false)}
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

export default Rembg;
