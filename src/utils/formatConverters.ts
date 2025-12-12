// Format converters - Simplified approach
// BMP and ICO libraries have compatibility issues, using fallback to PNG

/**
 * Enhanced canvasToBlob with format support
 * Note: Browser native support is limited to PNG, JPEG, WebP
 * ICO, BMP, GIF will fallback to PNG with console warning
 * 
 * @param canvas - Source canvas
 * @param mimeType - Target MIME type
 * @param quality - Quality (0-1) for lossy formats
 * @returns Blob
 */
export async function canvasToBlobEnhanced(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number = 1.0
): Promise<Blob> {
    // Supported formats by canvas.toBlob
    const nativeSupport = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

    // Fallback formats
    const fallbackFormats = ['image/x-icon', 'image/ico', 'image/bmp', 'image/gif'];

    if (fallbackFormats.includes(mimeType)) {
        console.warn(`Format ${mimeType} not natively supported by browser. Falling back to PNG.`);
        console.warn('For ICO/BMP/GIF support, a backend converter is recommended.');
        // Fallback to PNG
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert canvas to PNG'));
                },
                'image/png',
                1.0
            );
        });
    }

    // Native support
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to convert canvas to blob'));
            },
            mimeType,
            quality
        );
    });
}

/**
 * Get MIME type from format string
 */
export function getMimeTypeFromFormat(format: string): string {
    const mimeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'avif': 'image/avif',
        'bmp': 'image/bmp',
        'gif': 'image/gif',
        'ico': 'image/x-icon'
    };
    return mimeMap[format.toLowerCase()] || 'image/png';
}

/**
 * Get supported formats with notes
 */
export function getSupportedFormats() {
    return {
        native: ['PNG', 'JPEG', 'WebP', 'AVIF'],
        fallback: ['BMP', 'GIF', 'ICO'],
        notes: {
            'BMP': 'Falls back to PNG - backend converter recommended',
            'GIF': 'Falls back to PNG - backend converter recommended for animation',
            'ICO': 'Falls back to PNG - backend converter recommended for multi-size icons'
        }
    };
}
