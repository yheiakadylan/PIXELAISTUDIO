/**
 * Canvas Helper Utilities
 * Provides functions for image/canvas manipulation and conversion
 */

/**
 * Load an image file to a canvas element
 */
export const imageToCanvas = (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src); // Clean up
            resolve(canvas);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
};

/**
 * Create a thumbnail preview (200px max width/height)
 * Memory optimization: 20MB RAM for 100 images vs 2GB for full-size
 * 
 * @param file - Image file
 * @param maxSize - Maximum width/height (default: 200px)
 * @returns Data URL of thumbnail
 */
export const createThumbnail = (file: File, maxSize: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            // Calculate thumbnail dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            // Create thumbnail canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to get 2D context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url); // Clean up immediately

            // Convert to data URL (JPEG 80% for smaller size)
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
};

/**
 * Convert canvas to Blob with specified format
 */
export const canvasToBlob = (
    canvas: HTMLCanvasElement,
    format: string = 'image/png',
    quality: number = 1.0
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            format,
            quality
        );
    });
};

/**
 * Resize canvas with quality preservation
 */
export const resizeCanvas = (
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    return canvas;
};

/**
 * Fallback download method for browsers without File System Access API
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Get file extension from mime type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
    const map: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
    };
    return map[mimeType] || 'png';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
