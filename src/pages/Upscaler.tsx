import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType } from '../utils/canvasHelpers';

interface UpscaledImage {
    id: string;
    file: File;
    original: string; // data URL
    upscaled?: string; // data URL after upscaling
    originalWidth: number;
    originalHeight: number;
    originalSize: number; // bytes
    upscaledWidth?: number;
    upscaledHeight?: number;
    upscaledSize?: number;
    canvas?: HTMLCanvasElement;
    status: 'idle' | 'processing' | 'done' | 'error';
    progress: number;
}

type ModelType = 'photo' | 'anime';
type ScaleRate = 1 | 2 | 4 | 8;

const Upscaler: React.FC = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState<UpscaledImage | null>(null);
    const [model, setModel] = useState<ModelType>('photo');
    const [scaleRate, setScaleRate] = useState<ScaleRate>(2);
    const [zoom, setZoom] = useState(100); // 100 = 100%
    const [podMode, setPodMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { injectDPI } = useDPIInjector();

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0]; // Single image only
        try {
            const canvas = await imageToCanvas(file);
            const original = canvas.toDataURL();

            const newImage: UpscaledImage = {
                id: `${file.name}-${Date.now()}`,
                file,
                original,
                originalWidth: canvas.width,
                originalHeight: canvas.height,
                originalSize: file.size,
                status: 'idle',
                progress: 0,
                canvas
            };

            setImage(newImage);
        } catch (error) {
            console.error(`Error loading ${file.name}:`, error);
        }
    };

    const processUpscale = async () => {
        if (!image) return;

        setImage(prev => prev ? { ...prev, status: 'processing', progress: 0 } : null);

        try {
            // TODO: Replace with Real-ESRGAN API call
            // For now, use canvas bicubic scaling as placeholder

            const targetWidth = image.originalWidth * scaleRate;
            const targetHeight = image.originalHeight * scaleRate;

            setImage(prev => prev ? { ...prev, progress: 30 } : null);

            // Create upscaled canvas
            const upscaledCanvas = document.createElement('canvas');
            upscaledCanvas.width = targetWidth;
            upscaledCanvas.height = targetHeight;
            const ctx = upscaledCanvas.getContext('2d')!;

            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            setImage(prev => prev ? { ...prev, progress: 60 } : null);

            // Draw scaled image
            ctx.drawImage(image.canvas!, 0, 0, targetWidth, targetHeight);

            setImage(prev => prev ? { ...prev, progress: 80 } : null);

            const upscaled = upscaledCanvas.toDataURL('image/png');
            const blob = await canvasToBlob(upscaledCanvas, 'image/png', 1.0);

            setImage(prev => prev ? {
                ...prev,
                upscaled,
                upscaledWidth: targetWidth,
                upscaledHeight: targetHeight,
                upscaledSize: blob.size,
                canvas: upscaledCanvas,
                status: 'done',
                progress: 100
            } : null);

        } catch (error) {
            console.error('Upscaling error:', error);
            setImage(prev => prev ? { ...prev, status: 'error' } : null);
        }
    };

    const handleDownload = async () => {
        if (!image || !image.canvas || !image.upscaled) return;

        const mimeType = 'image/png';
        let blob = await canvasToBlob(image.canvas, mimeType, 1.0);

        if (podMode) {
            blob = await injectDPI(blob, 300);
        }

        const extension = getExtensionFromMimeType(mimeType);
        const baseFilename = image.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseFilename}_upscaled_x${scaleRate}.${extension}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-retro-bg dark:bg-retro-bg-dark transition-colors">
            {/* Header */}
            <div className="border-b-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                    <button
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-display text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1 absolute left-4"
                        onClick={() => navigate('/')}
                    >
                        ← Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-display">🔍 IMAGE UPSCALER</h1>
                        <p className="text-sm font-body text-gray-600 dark:text-gray-400">
                            AI-powered image upscaling with Real-ESRGAN
                        </p>
                    </div>
                </div>
            </div>

            {!image ? (
                /* Upload Screen */
                <div className="max-w-[1200px] mx-auto px-4 py-20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display mb-4">Upscale Your Images</h2>
                        <p className="text-xl font-body text-gray-700 dark:text-gray-300">
                            Enhance image resolution up to 8x with AI
                        </p>
                    </div>

                    <div
                        className="border-4 border-dashed border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-retro"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">
                            image
                        </span>
                        <h3 className="text-2xl font-display mb-2">Click or Drag Image Here</h3>
                        <p className="font-body text-gray-600 dark:text-gray-400 mb-4 text-lg">
                            Select a single image to upscale
                        </p>
                        <div className="inline-block px-6 py-3 bg-blue-500 border-4 border-black text-white font-display text-sm shadow-retro">
                            SELECT IMAGE
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                </div>
            ) : (
                /* Editor Screen */
                <div className="max-w-[1800px] mx-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Preview with Zoom */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-display">Preview</h3>
                                    <button
                                        className="px-6 py-3 bg-green-500 border-4 border-black text-white font-display hover:bg-green-600 transition-all shadow-retro flex items-center gap-2"
                                        onClick={handleDownload}
                                        disabled={!image.upscaled}
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        Download
                                    </button>
                                </div>

                                {/* Image Container with Zoom */}
                                <div className="relative bg-gray-100 dark:bg-gray-700 border-4 border-gray-300 overflow-auto" style={{ height: '600px' }}>
                                    <div className="flex items-center justify-center min-h-full p-4">
                                        <img
                                            src={image.upscaled || image.original}
                                            alt="Preview"
                                            style={{
                                                transform: `scale(${zoom / 100})`,
                                                transformOrigin: 'center',
                                                transition: 'transform 0.2s'
                                            }}
                                            className="max-w-none"
                                        />
                                    </div>

                                    {/* Processing Overlay */}
                                    {image.status === 'processing' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                                            <div className="bg-white dark:bg-gray-800 border-4 border-black p-8 shadow-retro">
                                                <p className="font-display text-2xl mb-6 text-center">Upscaling Image...</p>
                                                <div className="w-80 h-8 bg-gray-200 border-4 border-black overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 absolute inset-0"
                                                        style={{ width: `${image.progress}%` }}
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg z-10">
                                                        {image.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Zoom Controls */}
                                <div className="mt-4 flex items-center gap-4 justify-center">
                                    <button
                                        className="w-10 h-10 border-4 border-black bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="range"
                                        min="25"
                                        max="400"
                                        step="25"
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-64"
                                    />
                                    <button
                                        className="w-10 h-10 border-4 border-black bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                        onClick={() => setZoom(Math.min(400, zoom + 25))}
                                    >
                                        +
                                    </button>
                                    <span className="font-body text-lg font-bold">{zoom}%</span>
                                </div>

                                {/* Image Stats */}
                                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 border-4 border-gray-300">
                                    <div className="grid grid-cols-2 gap-4 font-body">
                                        <div>
                                            <p className="font-bold mb-2">Original:</p>
                                            <p className="text-sm">Size: {image.originalWidth} × {image.originalHeight} px</p>
                                            <p className="text-sm">File: {formatBytes(image.originalSize)}</p>
                                        </div>
                                        {image.upscaledWidth && (
                                            <div>
                                                <p className="font-bold mb-2 text-green-600">Upscaled:</p>
                                                <p className="text-sm">Size: {image.upscaledWidth} × {image.upscaledHeight} px</p>
                                                <p className="text-sm">File: {formatBytes(image.upscaledSize!)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Settings */}
                        <div className="space-y-6">
                            {/* Model Selection */}
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark">
                                <h3 className="text-xl font-display mb-4">Select Model</h3>

                                <div className="space-y-3">
                                    <button
                                        className={`w-full p-4 border-4 text-left font-body transition-all ${model === 'photo'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                        onClick={() => setModel('photo')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-lg">Photo</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Real-ESRGAN-x4plus</p>
                                                <p className="text-xs mt-1">For realistic photos and images</p>
                                            </div>
                                            {model === 'photo' && <span className="text-blue-500 text-2xl">✓</span>}
                                        </div>
                                    </button>

                                    <button
                                        className={`w-full p-4 border-4 text-left font-body transition-all ${model === 'anime'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                        onClick={() => setModel('anime')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-lg">Anime</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Real-ESRGAN-anime6B</p>
                                                <p className="text-xs mt-1">For anime, cartoons, illustrations</p>
                                            </div>
                                            {model === 'anime' && <span className="text-blue-500 text-2xl">✓</span>}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Upscale Rate */}
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark">
                                <h3 className="text-xl font-display mb-4">Upscale Rate</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    {([1, 2, 4, 8] as ScaleRate[]).map((rate) => (
                                        <button
                                            key={rate}
                                            className={`p-4 border-4 font-body text-lg font-bold transition-all ${scaleRate === rate
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                }`}
                                            onClick={() => setScaleRate(rate)}
                                        >
                                            ×{rate}
                                            {scaleRate === rate && <span className="ml-2 text-green-500">✓</span>}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                                    Output: {image.originalWidth * scaleRate} × {image.originalHeight * scaleRate} px
                                </p>
                            </div>

                            {/* Options */}
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark">
                                <h3 className="text-xl font-display mb-4">Options</h3>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={podMode}
                                        onChange={(e) => setPodMode(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-body">POD Mode (300 DPI)</span>
                                </label>
                            </div>

                            {/* Start Button */}
                            <button
                                className="w-full py-6 bg-gradient-to-r from-green-500 to-blue-500 border-4 border-black text-white font-display text-2xl hover:from-green-600 hover:to-blue-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1"
                                onClick={processUpscale}
                                disabled={image.status === 'processing'}
                            >
                                {image.status === 'processing' ? 'Processing...' : 'Start → Upscale'}
                            </button>

                            <button
                                className="w-full py-3 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-body hover:bg-gray-300 transition-all"
                                onClick={() => setImage(null)}
                            >
                                ← Choose Different Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upscaler;
