import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createThumbnail } from '../utils/canvasHelpers';

interface CraftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UploadedFile {
    file: File;
    thumbnail: string;
}

type ToolType = 'resize' | 'convert' | 'rembg' | 'upscale';

const CraftModal: React.FC<CraftModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newFiles: UploadedFile[] = [];
        for (const file of Array.from(files)) {
            try {
                const thumbnail = await createThumbnail(file, 150);
                newFiles.push({ file, thumbnail });
            } catch (error) {
                console.error('Error loading file:', error);
            }
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleToolClick = (tool: ToolType) => {
        const files = uploadedFiles.map(uf => uf.file);

        // Navigate with files in state
        navigate(`/${tool}`, { state: { autoLoadFiles: files } });

        // Close modal and reset
        onClose();
        setUploadedFiles([]);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    const tools = [
        {
            id: 'resize' as ToolType,
            name: 'Resize',
            icon: 'photo_size_select_large',
            color: 'blue',
            description: 'Change dimensions'
        },
        {
            id: 'convert' as ToolType,
            name: 'Convert',
            icon: 'sync_alt',
            color: 'green',
            description: 'Change format'
        },
        {
            id: 'rembg' as ToolType,
            name: 'Remove BG',
            icon: 'content_cut',
            color: 'purple',
            description: 'AI background removal'
        },
        {
            id: 'upscale' as ToolType,
            name: 'Upscale',
            icon: 'photo_filter',
            color: 'yellow',
            description: 'Enhance resolution'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-85 animate-fadeIn">
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 border-6 border-black dark:border-gray-400 shadow-retro-xl max-h-[90vh] overflow-auto transition-theme animate-scaleIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 border-b-6 border-black dark:border-gray-400 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-display text-white mb-1">🎮 Crafting Table</h2>
                        <p className="text-sm text-white/90 font-body">Upload your images, then choose your tool</p>
                    </div>
                    <button
                        className="w-12 h-12 bg-red-500 border-4 border-black text-white font-bold text-2xl hover:bg-red-600 transition-all duration-200 shadow-retro btn-lift"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Upload Zone */}
                <div className="p-6">
                    {uploadedFiles.length === 0 ? (
                        <div
                            className={`border-4 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                                : 'border-gray-400 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 animate-pulse'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">
                                upload_file
                            </span>
                            <h3 className="text-2xl font-display mb-2">Drop Your Images Here</h3>
                            <p className="font-body text-gray-600 dark:text-gray-400 mb-4">
                                or click to browse files
                            </p>
                            <div className="inline-block px-6 py-3 bg-blue-500 border-4 border-black text-white font-display shadow-retro">
                                SELECT FILES
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* File Thumbnails */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                                {uploadedFiles.map((uf, index) => (
                                    <div
                                        key={index}
                                        className="relative border-4 border-black dark:border-gray-400 bg-gray-100 dark:bg-gray-700 p-2 shadow-retro"
                                    >
                                        <img
                                            src={uf.thumbnail}
                                            alt={uf.file.name}
                                            className="w-full h-32 object-contain mb-2"
                                        />
                                        <p className="text-xs font-body truncate text-center">
                                            {uf.file.name}
                                        </p>
                                        <button
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-black text-white text-xs font-bold rounded-full hover:bg-red-600 hover:scale-110 transition-all duration-200"
                                            onClick={() => removeFile(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {/* Add More Button */}
                                <div
                                    className="border-4 border-dashed border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 transition-all duration-300"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-4xl text-gray-400">
                                            add
                                        </span>
                                        <p className="text-xs font-body text-gray-600 dark:text-gray-400 mt-1">
                                            Add More
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tool Selection */}
                            <div className="border-t-4 border-black dark:border-gray-400 pt-6">
                                <h3 className="text-xl font-display mb-4 text-center">
                                    Choose Your Tool ({uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'})
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {tools.map(tool => (
                                        <button
                                            key={tool.id}
                                            className={`p-6 border-4 border-black dark:border-gray-400 bg-${tool.color}-100 dark:bg-${tool.color}-900/20 hover:bg-${tool.color}-200 dark:hover:bg-${tool.color}-800/30 hover:scale-105 transition-all duration-200 shadow-retro btn-lift group`}
                                            onClick={() => handleToolClick(tool.id)}
                                        >
                                            <span className="material-symbols-outlined text-5xl mb-2 block text-center">
                                                {tool.icon}
                                            </span>
                                            <h4 className="font-display text-lg text-center mb-1">
                                                {tool.name}
                                            </h4>
                                            <p className="text-xs font-body text-center text-gray-600 dark:text-gray-400">
                                                {tool.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Hidden Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>
        </div>
    );
};

export default CraftModal;
