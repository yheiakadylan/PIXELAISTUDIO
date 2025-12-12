import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDPIInjector } from '../hooks/useDPIInjector';
import { imageToCanvas, canvasToBlob, getExtensionFromMimeType, createThumbnail } from '../utils/canvasHelpers';
import { removeBackground } from '@imgly/background-removal';

interface ProcessedImage {
    id: string;
    file: File;
    original: string; // data URL
    processed?: string; // data URL after removal
    progress: number; // 0-100
    status: 'idle' | 'processing' | 'done' | 'error';
    canvas?: HTMLCanvasElement;
}

const RemBg: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [images, setImages] = useState<ProcessedImage[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sliderPosition, setSliderPosition] = useState(50); // 0-100 for before/after slider
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasAutoLoaded = useRef(false);
    const { injectDPI } = useDPIInjector();

    // Auto settings: PNG + 300 DPI
    const format = 'png';
    const podMode = true;

    // Auto-load files from Craft Modal
    useEffect(() => {
        if (hasAutoLoaded.current) return;

        const autoLoadFiles = location.state?.autoLoadFiles as File[] | undefined;
        if (autoLoadFiles && autoLoadFiles.length > 0) {
            hasAutoLoaded.current = true;
            const fileList = new DataTransfer();
            autoLoadFiles.forEach(file => fileList.items.add(file));
            handleFileSelect(fileList.files);
            window.history.replaceState({}, '');
        }
    }, []);

    // Cleanup Object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach(img => {
                if (img.original) URL.revokeObjectURL(img.original);
                if (img.processed) URL.revokeObjectURL(img.processed);
            });
        };
    }, [images]);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newImages: ProcessedImage[] = [];

        for (const file of Array.from(files)) {
            try {
                const canvas = await imageToCanvas(file);
                const original = canvas.toDataURL(); // Full size for slider alignment

                newImages.push({
                    id: `${file.name}-${Date.now()}`,
                    file,
                    original,
                    status: 'processing',
                    progress: 0,
                    canvas
                });
            } catch (error) {
                console.error(`Error loading ${file.name}:`, error);
            }
        }

        setImages(prev => [...prev, ...newImages]);

        // Sequential processing to avoid hanging browser
        for (const img of newImages) {
            await processImage(img.id, img.file);
        }
    };

    const processImage = async (id: string, file: File) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, status: 'processing' as const } : img
        ));

        try {
            const blob = await removeBackground(file, {
                model: 'isnet_fp16', // Highest quality model
                output: {
                    quality: 1.0,
                    format: 'image/png'
                },
                progress: (_key: string, current: number, total: number) => {
                    const progress = Math.round((current / total) * 100);
                    setImages(prev => prev.map(img =>
                        img.id === id ? { ...img, progress } : img
                    ));
                },
            });

            // Convert to canvas for saving later
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

            const processed = canvas.toDataURL();

            setImages(prev => prev.map(image =>
                image.id === id ? { ...image, processed, canvas, status: 'done' as const, progress: 100 } : image
            ));
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            setImages(prev => prev.map(img =>
                img.id === id ? { ...img, status: 'error' as const } : img
            ));
        }
    };

    const handleRemoveImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedIndex >= images.length - 1) {
            setSelectedIndex(Math.max(0, images.length - 2));
        }
    };

    const handleDownload = async (img: ProcessedImage) => {
        if (!img.canvas || !img.processed) return;

        const mimeType = `image/${format}`;
        let blob = await canvasToBlob(img.canvas, mimeType, 1.0);

        if (podMode && (format === 'png')) {
            blob = await injectDPI(blob, 300);
        }

        const extension = getExtensionFromMimeType(mimeType);
        const baseFilename = img.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseFilename}_nobg.${extension}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = async () => {
        for (const img of images.filter(i => i.status === 'done')) {
            await handleDownload(img);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const selectedImage = images[selectedIndex];
    const isDragging = useRef(false);

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
                        <h1 className="text-2xl font-display">✂️ REMOVE BACKGROUND</h1>
                        <p className="text-sm font-body text-gray-600 dark:text-gray-400">
                            AI-powered background removal
                        </p>
                    </div>
                </div>
            </div>

            {images.length === 0 ? (
                /* Upload Screen */
                <div className="max-w-[1200px] mx-auto px-4 py-20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display mb-4">Remove Background</h2>
                        <p className="text-xl font-body text-gray-700 dark:text-gray-300">
                            AI automatically removes background from your images
                        </p>
                    </div>

                    <div
                        className="border-4 border-dashed border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-retro animate-pulse"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">
                            upload_file
                        </span>
                        <h3 className="text-2xl font-display mb-2">Click or Drag Images Here</h3>
                        <p className="font-body text-gray-600 dark:text-gray-400 mb-4 text-lg">
                            Select single or multiple images
                        </p>
                        <div className="inline-block px-6 py-3 bg-blue-500 border-4 border-black text-white font-display text-sm shadow-retro">
                            SELECT IMAGES
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
                </div>
            ) : (
                /* Preview + Gallery */
                <div className="max-w-[1800px] mx-auto p-8">
                    {/* Large Preview with Before/After Slider */}
                    <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark mb-6 transition-theme animate-scaleIn">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-display">Preview</h3>
                            <div className="flex gap-4">
                                <button
                                    className="px-6 py-3 bg-green-500 border-4 border-black text-white font-display hover:bg-green-600 transition-all duration-200 shadow-retro btn-lift flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleDownloadAll}
                                    disabled={images.filter(i => i.status === 'done').length === 0}
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    Save All
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-500 border-4 border-black text-white font-body hover:bg-blue-600 transition-all duration-200 shadow-retro btn-lift disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => selectedImage && handleDownload(selectedImage)}
                                    disabled={!selectedImage?.processed}
                                >
                                    <span className="material-symbols-outlined">download</span>
                                </button>
                            </div>
                        </div>

                        {selectedImage && (
                            <div className="relative bg-white dark:bg-gray-900 border-4 border-gray-300 flex items-center justify-center" style={{ height: '500px' }}>
                                {/* Before/After Slider Container */}
                                <div
                                    className="relative cursor-ew-resize inline-block select-none"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const percentage = (x / rect.width) * 100;
                                        setSliderPosition(Math.max(0, Math.min(100, percentage)));
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        isDragging.current = true;
                                    }}
                                    onMouseUp={(e) => {
                                        e.preventDefault();
                                        isDragging.current = false;
                                    }}
                                    onMouseLeave={() => isDragging.current = false}
                                    onMouseMove={(e) => {
                                        if (isDragging.current) {
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const percentage = (x / rect.width) * 100;
                                            setSliderPosition(Math.max(0, Math.min(100, percentage)));
                                        }
                                    }}
                                >
                                    {/* Container for both images */}
                                    <div className="relative inline-block">
                                        {/* Bottom Layer: Processed Image (After - Right side) */}
                                        {selectedImage.processed && (
                                            <div className="checkerboard">
                                                <img
                                                    src={selectedImage.processed}
                                                    alt="After"
                                                    className="max-h-[468px] block pointer-events-none"
                                                    style={{ maxWidth: '100%' }}
                                                    draggable={false}
                                                />
                                            </div>
                                        )}

                                        {/* Top Layer: Original Image (Before - Left side, clipped) */}
                                        <div
                                            className="absolute top-0 left-0 overflow-hidden"
                                            style={{
                                                width: `${sliderPosition}%`,
                                                height: '100%'
                                            }}
                                        >
                                            <img
                                                src={selectedImage.original}
                                                alt="Before"
                                                className="max-h-[468px] block pointer-events-none"
                                                style={{ maxWidth: 'none' }}
                                                draggable={false}
                                            />
                                        </div>
                                    </div>

                                    {/* Slider Handle */}
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                                        style={{ left: `${sliderPosition}%`, pointerEvents: 'none' }}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-sm">unfold_more</span>
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-75 text-white font-body text-sm pointer-events-none">
                                        Before
                                    </div>
                                    {selectedImage.processed && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-black bg-opacity-75 text-white font-body text-sm pointer-events-none">
                                            After
                                        </div>
                                    )}

                                    {/* Processing Overlay */}
                                    {selectedImage.status === 'processing' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                                            <div className="bg-white dark:bg-gray-800 border-4 border-black p-8 shadow-retro">
                                                <p className="font-display text-2xl mb-6 text-center">Removing Background...</p>
                                                <div className="w-80 h-8 bg-gray-200 border-4 border-black overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 flex items-center justify-center absolute inset-0 shimmer"
                                                        style={{ width: `${selectedImage.progress}%` }}
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg z-10">
                                                        {selectedImage.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-400 p-6 shadow-retro dark:shadow-retro-dark transition-theme animate-slideInUp" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-display">Images ({images.length})</h3>
                            <button
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-4 border-black dark:border-gray-400 font-body text-sm hover:bg-gray-300 transition-all duration-200 shadow-retro btn-lift"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                + Add More
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className={`stagger-item relative cursor-pointer border-4 transition-all duration-200 ${selectedIndex === index
                                        ? 'border-blue-500 shadow-retro scale-105'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:scale-105'
                                        }`}
                                    onClick={() => setSelectedIndex(index)}
                                    style={{ animationDelay: `${300 + index * 50}ms` }}
                                >
                                    <button
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 border-4 border-black text-white flex items-center justify-center hover:bg-red-600 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage(img.id);
                                        }}
                                    >
                                        ×
                                    </button>

                                    <div className="relative">
                                        <img
                                            src={img.processed || img.original}
                                            alt={img.file.name}
                                            className="w-full h-32 object-cover"
                                        />

                                        {/* Progress Bar Overlay */}
                                        {img.status === 'processing' && (
                                            <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center">
                                                <p className="text-white font-bold text-sm mb-3">{img.progress}%</p>
                                                <div className="w-3/4 h-3 bg-gray-700 border-2 border-white overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all absolute"
                                                        style={{ width: `${img.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        {img.status === 'done' && (
                                            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 border-2 border-white text-white text-xs font-bold">
                                                ✓ Done
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 text-xs font-body truncate">
                                        {img.file.name}
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


                </div >
            )
            }
        </div >
    );
};

export default RemBg;
