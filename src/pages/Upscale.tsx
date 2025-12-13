import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUpscaler } from '../hooks/useUpscaler';

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
    status: 'idle' | 'processing' | 'done' | 'error';
    progress: number;
}

type ModelType = 'photo' | 'anime';
type ScaleRate = 2 | 4 | 8;

const Upscale: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [image, setImage] = useState<UpscaledImage | null>(null);
    const [model, setModel] = useState<ModelType>('photo');
    const [scaleRate, setScaleRate] = useState<ScaleRate>(2);
    const [zoom, setZoom] = useState(100); // 100 = 100%
    const [comparisonMode, setComparisonMode] = useState(false); // Before/After comparison
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasAutoLoaded = useRef(false);

    // Initialize AI upscaler
    const { upscale, isModelLoading, modelLoadProgress, error: upscalerError, isReady } = useUpscaler(model);

    // Auto-load from Craft Modal (single file only)
    useEffect(() => {
        if (hasAutoLoaded.current) return;

        const autoLoadFiles = location.state?.autoLoadFiles as File[] | undefined;
        if (autoLoadFiles && autoLoadFiles.length > 0) {
            hasAutoLoaded.current = true;
            const fileList = new DataTransfer();
            fileList.items.add(autoLoadFiles[0]); // Only first file
            handleFileSelect(fileList.files);
            window.history.replaceState({}, '');
        }
    }, []);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0]; // Single image only
        try {
            const img = new Image();
            const original = URL.createObjectURL(file);

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = original;
            });

            const newImage: UpscaledImage = {
                id: `${file.name}-${Date.now()}`,
                file,
                original,
                originalWidth: img.width,
                originalHeight: img.height,
                originalSize: file.size,
                status: 'idle',
                progress: 0,
            };

            setImage(newImage);
        } catch (error) {
            console.error(`Error loading ${file.name}:`, error);
        }
    };

    const processUpscale = async () => {
        if (!image) return;

        if (!isReady) {
            setImage(prev => prev ? { ...prev, status: 'error' } : null);
            return;
        }

        setImage(prev => prev ? { ...prev, status: 'processing', progress: 0 } : null);

        try {
            // Real AI upscaling with progress tracking
            const upscaledDataUrl = await upscale(
                image.original,
                scaleRate,
                (progress) => {
                    setImage(prev => prev ? { ...prev, progress: Math.round(progress) } : null);
                }
            );

            // Get dimensions and size
            const upscaledImg = new Image();
            await new Promise<void>((resolve, reject) => {
                upscaledImg.onload = () => resolve();
                upscaledImg.onerror = reject;
                upscaledImg.src = upscaledDataUrl;
            });

            // Convert to blob to get size
            const response = await fetch(upscaledDataUrl);
            const blob = await response.blob();

            setImage(prev => prev ? {
                ...prev,
                upscaled: upscaledDataUrl,
                upscaledWidth: upscaledImg.width,
                upscaledHeight: upscaledImg.height,
                upscaledSize: blob.size,
                status: 'done',
                progress: 100
            } : null);

        } catch (error) {
            console.error('Upscaling error:', error);
            setImage(prev => prev ? { ...prev, status: 'error' } : null);
            alert(error instanceof Error ? error.message : 'Upscaling failed');
        }
    };

    const handleDownload = async () => {
        if (!image || !image.upscaled) return;

        const link = document.createElement('a');
        link.href = image.upscaled;
        link.download = `${image.file.name.replace(/\.[^/.]+$/, '')}_upscaled_x${scaleRate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="min-h-screen bg-retro-bg dark:bg-retro-bg-dark transition-theme animate-fadeIn">
            {/* Header */}
            <div className="border-b-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 p-4 transition-theme">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                    <button
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-display text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-retro btn-lift absolute left-4"
                        onClick={() => navigate('/')}
                    >
                        ← Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-display">🔍 IMAGE UPSCALER</h1>
                        <p className="text-sm font-body text-gray-600 dark:text-gray-400">
                            AI-powered upscaling with Real-ESRGAN
                        </p>
                        {upscalerError && (
                            <p className="text-sm font-body text-red-600 dark:text-red-400 mt-2">
                                ⚠️ {upscalerError}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {!image ? (
                /* Upload Screen */
                <div className="max-w-[1200px] mx-auto px-4 py-20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display mb-4">Upscale Your Images</h2>
                        <p className="text-xl font-body text-gray-700 dark:text-gray-300">
                            Enhance resolution up to 8x with AI
                        </p>
                    </div>

                    <div
                        className="border-4 border-dashed border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-retro animate-pulse"
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
                <div className="max-w-[1600px] mx-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left: Preview with Zoom (3 cols) */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 shadow-retro dark:shadow-retro-dark">
                                {/* Preview Header */}
                                <div className="flex items-center justify-between p-4 border-b-4 border-black dark:border-gray-400">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-display">Preview</h3>
                                        {image.upscaled && (
                                            <button
                                                className={`px-4 py-2 border-4 border-black font-body text-sm transition-all ${comparisonMode
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                                                    }`}
                                                onClick={() => setComparisonMode(!comparisonMode)}
                                            >
                                                {comparisonMode ? '👁️ Comparing' : '🔄 Compare Before/After'}
                                            </button>
                                        )}
                                    </div>
                                    {image.upscaled && (
                                        <button
                                            className="px-6 py-3 bg-green-500 border-4 border-black text-white font-display hover:bg-green-600 transition-all duration-200 shadow-retro btn-lift flex items-center gap-2"
                                            onClick={handleDownload}
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                            Download
                                        </button>
                                    )}
                                </div>

                                {/* Image Container with Zoom or Comparison */}
                                <div className="relative bg-gray-100 dark:bg-gray-700 overflow-hidden" style={{ height: '500px' }}>
                                    {comparisonMode && image.upscaled ? (
                                        // Split-Screen Before/After Comparison Mode
                                        <div className="relative w-full h-full flex">
                                            {/* Left Side - Original */}
                                            <div className="relative w-1/2 h-full flex items-center justify-center bg-black border-r-2 border-white">
                                                <img
                                                    src={image.original}
                                                    alt="Original"
                                                    style={{
                                                        maxHeight: '468px',
                                                        maxWidth: '100%',
                                                        width: 'auto',
                                                        height: 'auto',
                                                        transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                                                        transformOrigin: 'center',
                                                        imageRendering: 'pixelated',
                                                    }}
                                                />
                                                {/* Original Info Overlay */}
                                                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded font-body text-xs">
                                                    <div className="font-bold">Original: {image.originalWidth} × {image.originalHeight} px</div>
                                                    <div className="text-gray-300">Size: {formatBytes(image.originalSize)}</div>
                                                </div>
                                            </div>

                                            {/* Center Divider */}
                                            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg z-10 -translate-x-1/2">
                                                {/* Arrows indicator */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                                                    <div className="bg-white border-2 border-black rounded-full p-2 shadow-lg">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M15 18l-6-6 6-6M9 18l-6-6 6-6" />
                                                        </svg>
                                                    </div>
                                                    <div className="bg-white border-2 border-black rounded-full p-2 shadow-lg">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M9 18l6-6-6-6M15 18l6-6-6-6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side - Upscaled */}
                                            <div className="relative w-1/2 h-full flex items-center justify-center bg-black border-l-2 border-white">
                                                <img
                                                    src={image.upscaled}
                                                    alt="Upscaled"
                                                    style={{
                                                        maxHeight: '468px',
                                                        maxWidth: '100%',
                                                        width: 'auto',
                                                        height: 'auto',
                                                        transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                                                        transformOrigin: 'center',
                                                    }}
                                                />
                                                {/* Upscaled Info Overlay */}
                                                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded font-body text-xs">
                                                    <div className="font-bold">AI Enhanced: {image.upscaledWidth} × {image.upscaledHeight} px</div>
                                                    <div className="text-gray-300">Size: {formatBytes(image.upscaledSize!)} • {scaleRate}x upscale</div>
                                                </div>
                                            </div>

                                            {/* Fullscreen Button */}
                                            <button
                                                className="absolute top-4 right-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded transition-all z-10"
                                                onClick={() => setZoom(zoom === 100 ? 200 : 100)}
                                                title={zoom === 100 ? "Zoom in" : "Zoom out"}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {zoom === 100 ? 'zoom_in' : 'zoom_out'}
                                                </span>
                                            </button>
                                        </div>
                                    ) : (
                                        // Normal Preview Mode
                                        <div className="flex items-center justify-center min-h-full p-4">
                                            <img
                                                src={image.upscaled || image.original}
                                                alt="Preview"
                                                style={{
                                                    maxHeight: '468px',
                                                    width: 'auto',
                                                    transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                                                    transformOrigin: 'center',
                                                    transition: 'transform 0.2s'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Processing Overlay */}
                                    {image.status === 'processing' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
                                            <div className="bg-white dark:bg-gray-800 border-4 border-black p-8 shadow-retro max-w-md">
                                                <p className="font-display text-2xl mb-4 text-center">🤖 AI Upscaling...</p>
                                                
                                                {/* Status Messages */}
                                                <div className="mb-4 text-center">
                                                    {image.progress !== undefined && (
                                                        <>
                                                            {image.progress < 10 && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse">
                                                                    🔄 Connecting to server...
                                                                </p>
                                                            )}
                                                            {image.progress >= 10 && image.progress < 20 && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse">
                                                                    📤 Uploading image to backend...
                                                                </p>
                                                            )}
                                                            {image.progress >= 20 && image.progress < 50 && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse">
                                                                    🤖 AI is analyzing and enhancing...
                                                                </p>
                                                            )}
                                                            {image.progress >= 50 && image.progress < 80 && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse">
                                                                    ✨ Applying details and refinements...
                                                                </p>
                                                            )}
                                                            {image.progress >= 80 && image.progress < 100 && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 animate-pulse">
                                                                    📥 Downloading enhanced result...
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                <div className="w-80 h-8 bg-gray-200 border-4 border-black overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 absolute inset-0 shimmer"
                                                        style={{ width: `${image.progress || 0}%` }}
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg z-10">
                                                        {image.progress || 0}%
                                                    </span>
                                                </div>
                                                
                                                {/* Warning for slow first request */}
                                                {image.progress !== undefined && image.progress < 20 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                                                        ⏱️ First request may take ~30s as server wakes up
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Model Loading Overlay */}
                                    {isModelLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
                                            <div className="bg-white dark:bg-gray-800 border-4 border-black p-8 shadow-retro">
                                                <p className="font-display text-2xl mb-6 text-center">📦 Loading AI Model...</p>
                                                <div className="w-80 h-8 bg-gray-200 border-4 border-black overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 absolute inset-0 shimmer"
                                                        style={{ width: `${modelLoadProgress}%` }}
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg z-10">
                                                        {modelLoadProgress}%
                                                    </span>
                                                </div>
                                                <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {model === 'photo' ? 'ESRGAN-Thick (Photos)' : 'ESRGAN-Slim (Anime)'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Zoom Controls */}
                                <div className="p-4 border-t-4 border-black dark:border-gray-400 flex items-center gap-4 justify-center bg-gray-50 dark:bg-gray-900">
                                    <button
                                        className="w-10 h-10 border-4 border-black bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-xl"
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
                                        className="w-10 h-10 border-4 border-black bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-xl"
                                        onClick={() => setZoom(Math.min(400, zoom + 25))}
                                    >
                                        +
                                    </button>
                                    <span className="font-body text-lg font-bold min-w-[80px] text-center">Zoom: {zoom}%</span>
                                </div>

                                {/* Image Stats */}
                                <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t-4 border-black dark:border-gray-400">
                                    <div className="grid grid-cols-2 gap-6 font-body text-sm">
                                        <div className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-300">
                                            <p className="font-bold mb-2 text-blue-600">Original:</p>
                                            <p>Size: <span className="font-bold">{image.originalWidth} × {image.originalHeight}</span> px</p>
                                            <p>File: <span className="font-bold">{formatBytes(image.originalSize)}</span></p>
                                        </div>
                                        {image.upscaledWidth && (
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                                                <p className="font-bold mb-2 text-green-600">Upscaled:</p>
                                                <p>Size: <span className="font-bold">{image.upscaledWidth} × {image.upscaledHeight}</span> px</p>
                                                <p>File: <span className="font-bold">{formatBytes(image.upscaledSize!)}</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Settings (1 col) */}
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
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-bold text-lg mb-1">📷 Photo</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Real-ESRGAN-x4plus</p>
                                                <p className="text-xs mt-1">For realistic photos</p>
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
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-bold text-lg mb-1">🎨 Anime</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Real-ESRGAN-anime6B</p>
                                                <p className="text-xs mt-1">For anime & illustrations</p>
                                            </div>
                                            {model === 'anime' && <span className="text-blue-500 text-2xl">✓</span>}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Upscale Rate */}
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark">
                                <h3 className="text-xl font-display mb-4">Upscale Rate</h3>

                                <div className="grid grid-cols-3 gap-3">
                                    {([2, 4, 8] as ScaleRate[]).map((rate) => (
                                        <button
                                            key={rate}
                                            className={`p-4 border-4 font-body text-lg font-bold transition-all ${scaleRate === rate
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                                }`}
                                            onClick={() => setScaleRate(rate)}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl">×{rate}</div>
                                                {scaleRate === rate && <span className="text-sm">✓</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                                    Output: <span className="font-bold">{image.originalWidth * scaleRate} × {image.originalHeight * scaleRate}</span> px
                                </p>
                            </div>

                            {/* Start Button */}
                            <button
                                className="w-full py-6 bg-gradient-to-r from-green-500 to-blue-500 border-4 border-black text-white font-display text-2xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-retro btn-lift disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={processUpscale}
                                disabled={image.status === 'processing'}
                            >
                                {image.status === 'processing' ? 'Processing...' : image.status === 'done' ? 'Upscale Again' : 'Upscale'}
                            </button>

                            <button
                                className="w-full py-3 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-body hover:bg-gray-300 transition-all shadow-retro"
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

export default Upscale;
