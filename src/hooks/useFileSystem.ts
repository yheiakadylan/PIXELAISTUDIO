import { useState, useCallback } from 'react';

interface FileSystemResult {
    saveToFolder: (files: { blob: Blob; filename: string }[]) => Promise<void>;
    saveSingleFile: (blob: Blob, filename: string) => Promise<void>;
    isSupported: boolean;
    isSaving: boolean;
    error: string | null;
}

/**
 * Hook for saving files using File System Access API
 * Falls back to standard download if API is not supported
 */
export const useFileSystem = (): FileSystemResult => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if File System Access API is supported
    const isSupported = 'showDirectoryPicker' in window;

    /**
     * Save multiple files to a user-selected folder
     */
    const saveToFolder = useCallback(async (files: { blob: Blob; filename: string }[]): Promise<void> => {
        setIsSaving(true);
        setError(null);

        try {
            if (!isSupported) {
                // Fallback: Download each file individually
                for (const file of files) {
                    const url = URL.createObjectURL(file.blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    // Small delay between downloads to prevent browser blocking
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                setIsSaving(false);
                return;
            }

            // Request directory access
            const dirHandle = await (window as any).showDirectoryPicker({
                mode: 'readwrite',
            });

            // Save each file
            for (const file of files) {
                const fileHandle = await dirHandle.getFileHandle(file.filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(file.blob);
                await writable.close();
            }

            setIsSaving(false);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // User cancelled - not an error
                setError(null);
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Failed to save files';
                setError(errorMessage);
            }
            setIsSaving(false);
            throw err;
        }
    }, [isSupported]);

    /**
     * Save a single file
     */
    const saveSingleFile = useCallback(async (blob: Blob, filename: string): Promise<void> => {
        setIsSaving(true);
        setError(null);

        try {
            if (!isSupported) {
                // Fallback: Standard download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setIsSaving(false);
                return;
            }

            // Use File System Access API for single file
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: 'Images',
                        accept: {
                            'image/png': ['.png'],
                            'image/jpeg': ['.jpg', '.jpeg'],
                            'image/webp': ['.webp'],
                        },
                    },
                ],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            setIsSaving(false);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // User cancelled - not an error
                setError(null);
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
                setError(errorMessage);
            }
            setIsSaving(false);
            throw err;
        }
    }, [isSupported]);

    return {
        saveToFolder,
        saveSingleFile,
        isSupported,
        isSaving,
        error,
    };
};
