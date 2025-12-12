import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolLayout from '../components/layout/ToolLayout';
import { useFileSystem } from '../hooks/useFileSystem';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface ProcessedImage {
    id: string;
    file: File;
    preview: string;
    processed: boolean;
    canvas?: HTMLCanvasElement;
}

const Convert: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<ProcessedImage[]>([]);
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
                    processed: true,
                    canvas,
                });
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }

        setImages((prev) => [...prev, ...processedImages]);
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
                const filename = `${baseFilename}_converted.${extension}`;

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
                title="🔄 FORMAT CONVERT"
                description="Convert images between PNG/JPG/WEBP formats"
                onProcess={handleProcess}
                processedImages={images}
                onSaveAll={handleSaveAll}
            >
                {/* Format & Quality Controls */}
                <div className="nes-container is-dark shadow-hard mb-6">
                    <h3 className="text-lg mb-4 text-nes-blue">⚙️ Conversion Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-nes-gray mb-2 block">Output Format</label>
                            <div className="nes-select is-dark">
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                >
                                    <option value="png">PNG (Lossless)</option>
                                    <option value="jpg">JPG (Compressed)</option>
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
                                />
                                <span className="text-sm">
                                    POD Mode (300 DPI) {podMode && '✓'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 p-3 border-2 border-white">
                        <p className="text-xs text-nes-gray">
                            💡 <strong>Tip:</strong> PNG is best for graphics with transparency.
                            JPG is best for photos. WEBP offers smaller sizes.
                        </p>
                    </div>
                </div>
            </ToolLayout>
        </div>
    );
};

export default Convert;
