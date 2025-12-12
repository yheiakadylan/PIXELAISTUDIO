import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasAutoLoaded = useRef(false);

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

        setImage(prev => prev ? { ...prev, status: 'processing', progress: 0 } : null);

        try {
            // TODO: Replace with Real-ESRGAN API call
            // For now, use placeholder - would need backend Python API

            setImage(prev => prev ? { ...prev, progress: 30 } : null);

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            setImage(prev => prev ? { ...prev, progress: 60 } : null);

            // Create placeholder upscaled (just resize for demo)
            const targetWidth = image.originalWidth * scaleRate;
            const targetHeight = image.originalHeight * scaleRate;

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const img = new Image();
            img.src = image.original;
            await new Promise<void>((resolve) => {
                img.onload = () => resolve();
            });

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            setImage(prev => prev ? { ...prev, progress: 80 } : null);

            const upscaled = canvas.toDataURL('image/png');
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/png');
            });

            setImage(prev => prev ? {
                ...prev,
                upscaled,
                upscaledWidth: targetWidth,
                upscaledHeight: targetHeight,
                upscaledSize: blob.size,
                status: 'done',
                progress: 100
            } : null);

        } catch (error) {
            console.error('Upscaling error:', error);
            setImage(prev => prev ? { ...prev, status: 'error' } : null);
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
                            AI-powered upscaling with Real-ESRGAN
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
                            Enhance resolution up to 8x with AI
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
                <div className="max-w-[1600px] mx-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left: Preview with Zoom (3 cols) */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 shadow-retro dark:shadow-retro-dark">
                                {/* Preview Header */}
                                <div className="flex items-center justify-between p-4 border-b-4 border-black dark:border-gray-400">
                                    <h3 className="text-xl font-display">Preview</h3>
                                    {image.upscaled && (
                                        <button
                                            className="px-6 py-3 bg-green-500 border-4 border-black text-white font-display hover:bg-green-600 transition-all shadow-retro flex items-center gap-2"
                                            onClick={handleDownload}
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                            Download
                                        </button>
                                    )}
                                </div>

                                {/* Image Container with Zoom */}
                                <div className="relative bg-gray-100 dark:bg-gray-700 overflow-auto" style={{ height: '500px' }}>
                                    <div className="flex items-center justify-center min-h-full p-4">
                                        <img
                                            src={image.upscaled || image.original}
                                            alt="Preview"
                                            style={{
                                                maxHeight: '468px', // Fit to container (500px - padding)
                                                width: 'auto',
                                                transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                                                transformOrigin: 'center',
                                                transition: 'transform 0.2s'
                                            }}
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
                                className="w-full py-6 bg-gradient-to-r from-green-500 to-blue-500 border-4 border-black text-white font-display text-2xl hover:from-green-600 hover:to-blue-600 transition-all shadow-retro active:shadow-retro-active active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
