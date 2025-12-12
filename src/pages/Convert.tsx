import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
    canvas: HTMLCanvasElement;
    targetFormat?: 'png' | 'jpg' | 'webp';
}

const Convert: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [conversionMode, setConversionMode] = useState<'batch' | 'individual'>('batch');
    const [batchFormat, setBatchFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { injectDPI } = useDPIInjector();

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newImages: UploadedImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const canvas = await imageToCanvas(file);
                const preview = canvas.toDataURL();

                newImages.push({
                    id: `${file.name}-${Date.now()}-${i}`,
                    file,
                    preview,
                    canvas,
                    targetFormat: 'png' // default
                });
            } catch (error) {
                console.error(`Error loading ${file.name}:`, error);
            }
        }

        setImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleImageFormatChange = (id: string, format: 'png' | 'jpg' | 'webp') => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, targetFormat: format } : img
        ));
    };

    const handleConvert = async () => {
        if (images.length === 0) return;

        for (const img of images) {
            const format = conversionMode === 'batch' ? batchFormat : (img.targetFormat || 'png');
            const mimeType = `image/${format}`;
            let blob = await canvasToBlob(img.canvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

            if (podMode && (format === 'png' || format === 'jpg')) {
                blob = await injectDPI(blob, 300);
            }

            const extension = getExtensionFromMimeType(mimeType);
            const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
            const filename = `${baseFilename}_converted.${extension}`;

            // Download directly to browser's Downloads folder
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Small delay between downloads to avoid browser blocking
            if (images.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div className="min-h-screen bg-retro-bg dark:bg-retro-bg-dark transition-colors">
            {/* Header */}
            <div className="border-b-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-display text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1"
                        onClick={() => navigate('/')}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-display">🔄 FORMAT CONVERT</h1>
                        <p className="text-sm font-body text-gray-600 dark:text-gray-400">
                            Convert between PNG/JPG/WEBP formats
                        </p>
                    </div>
                </div>
            </div>

            {images.length === 0 ? (
                /* Upload Screen */
                <div className="max-w-4xl mx-auto p-8">
                    <div
                        className="border-4 border-dashed border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">
                            upload_file
                        </span>
                        <h2 className="text-2xl font-display mb-2">Upload Images</h2>
                        <p className="font-body text-gray-600 dark:text-gray-400 mb-4">
                            Click or drag images here
                        </p>
                        <p className="text-sm font-body text-gray-500">
                            Supports: PNG, JPG, WEBP
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                </div>
            ) : (
                /* Preview + Options */
                <div className="max-w-7xl mx-auto p-8 flex gap-8">
                    {/* Left: Image Preview Grid */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-display">Images ({images.length})</h3>
                                <button
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-body text-sm hover:bg-gray-300 transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    + Add More
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-2 shadow-retro group"
                                >
                                    <button
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 border-4 border-black text-white flex items-center justify-center hover:bg-red-600 z-10"
                                        onClick={() => handleRemoveImage(img.id)}
                                    >
                                        ×
                                    </button>
                                    <img src={img.preview} alt={img.file.name} className="w-full h-32 object-cover" />
                                    <div className="mt-2 text-xs font-body">
                                        <p className="truncate font-bold">{img.file.name}</p>
                                        {conversionMode === 'individual' && (
                                            <select
                                                value={img.targetFormat || 'png'}
                                                onChange={(e) => handleImageFormatChange(img.id, e.target.value as 'png' | 'jpg' | 'webp')}
                                                className="w-full mt-2 p-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-body text-xs"
                                            >
                                                <option value="png">→ PNG</option>
                                                <option value="jpg">→ JPG</option>
                                                <option value="webp">→ WEBP</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                        />
                    </div>

                    {/* Right: Convert Options */}
                    <div className="lg:w-96">
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark sticky top-4">
                            <h3 className="text-xl font-display mb-6">Convert options</h3>

                            {/* Mode Toggle (only show if multiple images) */}
                            {images.length > 1 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-body mb-3">Conversion Mode:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 border-4 transition-all ${conversionMode === 'batch'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            onClick={() => setConversionMode('batch')}
                                        >
                                            <p className="text-xs font-body">All Same</p>
                                            {conversionMode === 'batch' && <span className="text-green-500 text-xl">✓</span>}
                                        </button>
                                        <button
                                            className={`p-3 border-4 transition-all ${conversionMode === 'individual'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            onClick={() => setConversionMode('individual')}
                                        >
                                            <p className="text-xs font-body">Each Different</p>
                                            {conversionMode === 'individual' && <span className="text-green-500 text-xl">✓</span>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Format Selection (only show in batch mode or single image) */}
                            {(conversionMode === 'batch' || images.length === 1) && (
                                <div className="mb-6">
                                    <label className="block text-sm font-body mb-3">Output Format:</label>
                                    <div className="space-y-2">
                                        {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                                            <button
                                                key={fmt}
                                                className={`w-full p-3 border-4 text-left font-body transition-all ${batchFormat === fmt
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                    }`}
                                                onClick={() => setBatchFormat(fmt)}
                                            >
                                                {fmt.toUpperCase()} {batchFormat === fmt && <span className="float-right text-green-500">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* POD Mode */}
                            <div className="space-y-3 mb-6 border-t-2 border-gray-300 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={podMode}
                                        onChange={(e) => setPodMode(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-sm font-body">POD Mode (300 DPI)</span>
                                </label>
                            </div>

                            {/* Convert Button */}
                            <button
                                className="w-full px-6 py-4 bg-blue-500 border-4 border-black text-white font-display text-sm hover:bg-blue-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1 flex items-center justify-center gap-2"
                                onClick={handleConvert}
                            >
                                Convert IMAGES
                                <span className="material-symbols-outlined">arrow_circle_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Convert;
