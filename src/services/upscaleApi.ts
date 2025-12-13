/**
 * API client for backend upscaling service
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://pixelai-backend-8ysa.onrender.com';

export interface UpscaleOptions {
    modelType: 'photo' | 'anime';
    scaleRate: 2 | 4;
}

export interface UpscaleResponse {
    success: boolean;
    filename: string;
    original_size: [number, number];
    upscaled_size: [number, number];
    processing_time: number;
    message: string;
}

/**
 * Check if backend API is available
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.status === 'healthy';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * Upload and upscale image using backend API
 */
export async function upscaleImage(
    imageFile: File,
    options: UpscaleOptions,
    onProgress?: (progress: number) => void
): Promise<string> {
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('model_type', options.modelType);
        formData.append('scale_rate', options.scaleRate.toString());

        // Show initial progress
        onProgress?.(10);

        // Upload and process
        const response = await fetch(`${API_URL}/api/upscale`, {
            method: 'POST',
            body: formData,
        });

        onProgress?.(50);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upscaling failed');
        }

        const data: UpscaleResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Upscaling failed');
        }

        onProgress?.(80);

        // Download the upscaled image
        const downloadResponse = await fetch(`${API_URL}/api/download/${data.filename}`);

        if (!downloadResponse.ok) {
            throw new Error('Failed to download upscaled image');
        }

        const blob = await downloadResponse.blob();
        const imageUrl = URL.createObjectURL(blob);

        onProgress?.(100);

        return imageUrl;
    } catch (error) {
        console.error('Upscale error:', error);

        // User-friendly error messages
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('⚠️ Backend server unavailable. Please try again in 30 seconds (server may be sleeping).');
            } else if (error.message.includes('out of memory')) {
                throw new Error('❌ Image too large. Try a smaller image or lower scale rate (2x instead of 4x).');
            } else if (error.message.includes('timeout')) {
                throw new Error('⏱️ Processing timeout. Image may be too large. Try a smaller image.');
            }
        }

        throw error;
    }
}

/**
 * Convert image data URL to File
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}
