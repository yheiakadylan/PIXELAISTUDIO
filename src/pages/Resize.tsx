import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, resizeCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
    originalWidth: number;
    originalHeight: number;
    canvas: HTMLCanvasElement;
}

const Resize: React.FC = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [resizeMode, setResizeMode] = useState<'pixels' | 'percentage'>('pixels');
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(1024);
    const [percentage, setPercentage] = useState(50);
    const [customPercentage, setCustomPercentage] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [doNotEnlarge, setDoNotEnlarge] = useState(false);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { injectDPI } = useDPIInjector();

    const handleWidthChange = (newWidth: number) => {
        setWidth(newWidth);
        if (maintainAspectRatio && images.length > 0) {
            const aspectRatio = images[0].originalWidth / images[0].originalHeight;
            setHeight(Math.round(newWidth / aspectRatio));
        }
    };

    const handleHeightChange = (newHeight: number) => {
        setHeight(newHeight);
        if (maintainAspectRatio && images.length > 0) {
            const aspectRatio = images[0].originalWidth / images[0].originalHeight;
            setWidth(Math.round(newHeight * aspectRatio));
        }
    };

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
                    originalWidth: canvas.width,
                    originalHeight: canvas.height,
                    canvas,
                });
            } catch (error) {
                console.error(`Error loading ${file.name}:`, error);
            }
        }

        setImages((prev) => [...prev, ...newImages]);
    };

    const handleRemoveImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const calculateTargetDimensions = (img: UploadedImage) => {
        let targetWidth = width;
        let targetHeight = height;

        if (resizeMode === 'percentage') {
            const pct = percentage === 0 && customPercentage ? Number(customPercentage) : percentage;
            targetWidth = Math.round(img.originalWidth * (pct / 100));
            targetHeight = Math.round(img.originalHeight * (pct / 100));
        } else if (maintainAspectRatio) {
            const aspectRatio = img.originalWidth / img.originalHeight;
            if (width / height > aspectRatio) {
                targetWidth = Math.round(height * aspectRatio);
            } else {
                targetHeight = Math.round(width / aspectRatio);
            }
        }

        // Do not enlarge check (only for pixels mode)
        if (resizeMode === 'pixels' && doNotEnlarge && (targetWidth > img.originalWidth || targetHeight > img.originalHeight)) {
            targetWidth = img.originalWidth;
            targetHeight = img.originalHeight;
        }

        return { targetWidth, targetHeight };
    };

    const handleResize = async () => {
        if (images.length === 0) return;

        for (const img of images) {
            const { targetWidth, targetHeight } = calculateTargetDimensions(img);

            const resizedCanvas = resizeCanvas(img.canvas, targetWidth, targetHeight);
            const mimeType = `image/${format}`;
            let blob = await canvasToBlob(resizedCanvas, mimeType, format === 'jpg' ? 0.9 : 1.0);

            if (podMode && (format === 'png' || format === 'jpg')) {
                blob = await injectDPI(blob, 300);
            }

            const extension = getExtensionFromMimeType(mimeType);
            const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
            const filename = `${baseFilename}_resized.${extension}`;

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
            {/* Background Pattern */}
            <div className="fixed inset-0 -z-10 bg-[linear-gradient(45deg,#c4c4c4_25%,transparent_25%,transparent_75%,#c4c4c4_75%,#c4c4c4),linear-gradient(45deg,#c4c4c4_25%,transparent_25%,transparent_75%,#c4c4c4_75%,#c4c4c4)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222),linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222)]" />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b-4 border-black dark:border-gray-500 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        className="px-4 py-2 border-4 border-black dark:border-white bg-gray-200 dark:bg-gray-700 hover:translate-y-1 active:translate-y-2 transition-all shadow-retro active:shadow-retro-active font-display text-xs"
                        onClick={() => navigate('/')}
                    >
                        ← Back
                    </button>
                    <h1 className="text-xl md:text-2xl font-display">Resize IMAGE</h1>
                    <div className="w-20"></div>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Main Content */}
            {images.length === 0 ? (
                // Upload Screen
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display mb-4">Resize IMAGE</h2>
                        <p className="text-xl font-body text-gray-700 dark:text-gray-300">
                            Resize <span className="text-blue-600">JPG</span>, <span className="text-green-600">PNG</span>, <span className="text-purple-600">SVG</span> or <span className="text-red-600">GIF</span> by defining new height and width pixels.<br />
                            Change image dimensions in bulk.
                        </p>
                    </div>

                    <div
                        className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-16 text-center shadow-retro dark:shadow-retro-dark cursor-pointer hover:translate-y-1 transition-all"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-500 border-4 border-black flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-4xl">upload</span>
                                </div>
                                <div className="w-16 h-16 bg-blue-500 border-4 border-black flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-4xl">photo_library</span>
                                </div>
                            </div>
                            <button className="px-12 py-4 bg-blue-500 border-4 border-black text-white font-display text-lg hover:bg-blue-600 transition-colors shadow-retro">
                                Select images
                            </button>
                            <p className="text-gray-500 dark:text-gray-400 font-body text-lg">or drop images here</p>
                        </div>
                    </div>
                </div>
            ) : (
                // Resize Screen
                <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6 flex-col lg:flex-row">
                    {/* Left: Image Preview */}
                    <div className="flex-1">
                        <div className="mb-4">
                            <button
                                className="px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white border-4 border-black dark:border-white font-display text-xs hover:translate-y-1 transition-all shadow-retro flex items-center gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="text-2xl">+</span>
                                Add more images
                                <span className="px-2 py-1 bg-blue-500 border-2 border-white text-xs">{images.length}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map((img) => {
                                const { targetWidth, targetHeight } = calculateTargetDimensions(img);
                                return (
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
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
                                                <span className="px-1 bg-gray-200 dark:bg-gray-700 border border-gray-400">
                                                    {img.originalWidth} x {img.originalHeight}
                                                </span>
                                                <span>→</span>
                                                <span className="px-1 bg-blue-100 dark:bg-blue-900 border border-blue-500 text-blue-700 dark:text-blue-300 font-bold">
                                                    {targetWidth} x {targetHeight}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Resize Options */}
                    <div className="lg:w-96">
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark sticky top-4 min-h-[803px] flex flex-col">
                            <h3 className="text-xl font-display mb-6">Resize options</h3>

                            {/* Top section - will grow to push bottom content down */}
                            <div className="flex-grow">
                                {/* Mode Toggle */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button
                                        className={`p-4 border-4 transition-all ${resizeMode === 'pixels'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        onClick={() => setResizeMode('pixels')}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-2">grid_on</span>
                                        <p className="text-xs font-body">By pixels</p>
                                        {resizeMode === 'pixels' && <span className="text-green-500 text-xl">✓</span>}
                                    </button>
                                    <button
                                        className={`p-4 border-4 transition-all ${resizeMode === 'percentage'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        onClick={() => setResizeMode('percentage')}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-2">percent</span>
                                        <p className="text-xs font-body">By percentage</p>
                                        {resizeMode === 'percentage' && <span className="text-green-500 text-xl">✓</span>}
                                    </button>
                                </div>

                                {resizeMode === 'pixels' ? (
                                    <>
                                        <p className="text-sm font-body mb-4">Resize all images to a <strong>exact size</strong> of</p>

                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-body mb-2">Width (px):</label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                                                    className="w-full p-3 border-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-body text-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-body mb-2">Height (px):</label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                                    className="w-full p-3 border-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-body text-lg"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-body mb-4">Reduce images to <strong>percentage</strong> of original size:</p>
                                        <div className="space-y-2 mb-6">
                                            {[25, 50, 75].map((pct) => (
                                                <button
                                                    key={pct}
                                                    className={`w-full p-3 border-4 text-left font-body transition-all ${percentage === pct
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                        }`}
                                                    onClick={() => { setPercentage(pct); setCustomPercentage(''); }}
                                                >
                                                    {pct}% SMALLER {percentage === pct && <span className="float-right text-green-500">✓</span>}
                                                </button>
                                            ))}
                                            <button
                                                className={`w-full p-3 border-4 text-left font-body transition-all ${percentage === 0
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                    }`}
                                                onClick={() => setPercentage(0)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>Custom:</span>
                                                    {percentage === 0 ? (
                                                        <input
                                                            type="number"
                                                            value={customPercentage}
                                                            onChange={(e) => setCustomPercentage(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="Enter %"
                                                            min="1"
                                                            max="99"
                                                            className="flex-1 p-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-body text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">Enter custom %</span>
                                                    )}
                                                    {percentage === 0 && <span className="text-green-500">✓</span>}
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Checkboxes - Only show in pixels mode */}
                                {resizeMode === 'pixels' && (
                                    <div className="space-y-3 mb-6 border-t-2 border-gray-300 pt-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={maintainAspectRatio}
                                                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                                className="w-5 h-5"
                                            />
                                            <span className="text-sm font-body">Maintain aspect ratio</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={doNotEnlarge}
                                                onChange={(e) => setDoNotEnlarge(e.target.checked)}
                                                className="w-5 h-5"
                                            />
                                            <span className="text-sm font-body">Do not enlarge if smaller</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                            {/* End of flex-grow section */}

                            {/* Bottom section - anchored at bottom */}
                            <div>
                                {/* Output Settings */}
                                <div className="space-y-3 mb-6 border-t-2 border-gray-300 pt-4">
                                    <div>
                                        <label className="block text-sm font-body mb-2">Format:</label>
                                        <select
                                            value={format}
                                            onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                            className="w-full p-2 border-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-body"
                                        >
                                            <option value="png">PNG</option>
                                            <option value="jpg">JPG</option>
                                            <option value="webp">WEBP</option>
                                        </select>
                                    </div>
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

                                {/* Resize Button */}
                                <button
                                    className="w-full px-6 py-4 bg-blue-500 border-4 border-black text-white font-display text-sm hover:bg-blue-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1 flex items-center justify-center gap-2"
                                    onClick={handleResize}
                                >
                                    Resize IMAGES
                                    <span className="material-symbols-outlined">arrow_circle_right</span>
                                </button>
                            </div>
                            {/* End of bottom section */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resize;