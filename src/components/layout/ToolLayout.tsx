import React, { useCallback, useState } from 'react';
import OutputBar from '../shared/OutputBar';

interface ProcessedImage {
    id: string;
    file: File;
    preview: string;
    processed: boolean;
}

interface ToolLayoutProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    onProcess?: (files: File[]) => Promise<void>;
    processedImages?: ProcessedImage[];
    onSaveAll?: () => void;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({
    title,
    description,
    children,
    onProcess,
    processedImages = [],
    onSaveAll,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [podMode, setPodMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith('image/')
            );

            if (files.length > 0 && onProcess) {
                setIsProcessing(true);
                try {
                    await onProcess(files);
                } catch (error) {
                    console.error('Error processing files:', error);
                } finally {
                    setIsProcessing(false);
                }
            }
        },
        [onProcess]
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []).filter((file) =>
                file.type.startsWith('image/')
            );

            if (files.length > 0 && onProcess) {
                setIsProcessing(true);
                try {
                    await onProcess(files);
                } catch (error) {
                    console.error('Error processing files:', error);
                } finally {
                    setIsProcessing(false);
                }
            }

            // Reset input
            e.target.value = '';
        },
        [onProcess]
    );

    const handleSaveAll = useCallback(() => {
        if (onSaveAll) {
            onSaveAll();
        }
    }, [onSaveAll]);

    return (
        <div className="h-full bg-nes-dark flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 px-8 py-6 border-b-4 border-white bg-nes-dark shadow-hard">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl text-nes-blue mb-2">{title}</h1>
                    <p className="text-sm text-nes-gray">{description}</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Output Bar */}
                    <OutputBar
                        format={format}
                        onFormatChange={setFormat}
                        podMode={podMode}
                        onPodModeChange={setPodMode}
                        onSaveAll={handleSaveAll}
                        itemCount={processedImages.length}
                        disabled={isProcessing}
                    />

                    {/* Upload Zone */}
                    <div
                        className={`nes-container ${isDragging ? 'is-primary' : 'is-dark'
                            } shadow-hard mb-6 cursor-pointer transition-all`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📁</div>
                            <h3 className="text-xl mb-3">
                                {isDragging ? 'Drop files here!' : 'Upload Images'}
                            </h3>
                            <p className="text-sm text-nes-gray mb-4">
                                Drag & drop or click to select
                            </p>
                            <p className="text-xs text-nes-gray">
                                Supports: PNG, JPG, WEBP
                            </p>
                            <input
                                id="file-input"
                                type="file"
                                multiple
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Processing Status */}
                    {isProcessing && (
                        <div className="nes-container is-warning shadow-hard mb-6">
                            <p className="text-center text-sm">
                                🎮 Crafting... Please wait
                            </p>
                        </div>
                    )}

                    {/* Custom Content (Tool-specific controls) */}
                    {children}

                    {/* Queue Grid */}
                    {processedImages.length > 0 && (
                        <div className="nes-container is-dark shadow-hard">
                            <h3 className="text-xl mb-4 text-nes-blue">
                                📦 Queue ({processedImages.length} items)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {processedImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className="border-4 border-white p-2 relative"
                                    >
                                        <img
                                            src={img.preview}
                                            alt={img.file.name}
                                            className="w-full h-24 object-cover"
                                        />
                                        <p className="text-xs mt-2 truncate" title={img.file.name}>
                                            {img.file.name}
                                        </p>
                                        {img.processed && (
                                            <div className="absolute top-1 right-1 text-xl">✅</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ToolLayout;
