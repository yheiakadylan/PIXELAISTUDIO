import { useState, useCallback, useRef } from 'react';
import { upscaleImage, dataURLtoFile, checkHealth } from '../services/upscaleApi';

type ModelType = 'photo' | 'anime';

export function useUpscaler() {
    const [modelLoadProgress, setModelLoadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const backendHealthy = useRef<boolean | null>(null);

    /**
     * Check backend health (only once)
     */
    const checkBackendHealth = useCallback(async () => {
        if (backendHealthy.current !== null) {
            return backendHealthy.current;
        }

        try {
            const healthy = await checkHealth();
            backendHealthy.current = healthy;

            if (!healthy) {
                console.warn('Backend health check failed. Backend may be unavailable.');
            }

            return healthy;
        } catch (error) {
            console.error('Backend health check error:', error);
            backendHealthy.current = false;
            return false;
        }
    }, []);

    /**
     * Upscale image using backend API
     */
    const upscale = useCallback(async (
        imageDataUrl: string,
        scaleRate: 2 | 4 | 8,
        onProgress?: (progress: number) => void,
        modelType: ModelType = 'photo'
    ): Promise<string> => {
        setIsLoading(true);
        onProgress?.(0);

        try {
            // Check backend health first
            setModelLoadProgress(5);
            onProgress?.(5);

            const healthy = await checkBackendHealth();
            if (!healthy) {
                throw new Error('⚠️ Backend server is starting up. Please wait 30 seconds and try again.');
            }

            setModelLoadProgress(10);
            onProgress?.(10);

            // Convert data URL to File
            const imageFile = dataURLtoFile(imageDataUrl, 'image.png');

            // Handle 8x upscaling (not supported by backend, use 4x)
            const actualScaleRate = scaleRate === 8 ? 4 : scaleRate;

            if (scaleRate === 8) {
                console.warn('8x upscaling not supported by backend. Using 4x instead.');
            }

            setModelLoadProgress(20);
            onProgress?.(20);

            // Upload and upscale via API
            const result = await upscaleImage(
                imageFile,
                { modelType, scaleRate: actualScaleRate },
                (apiProgress) => {
                    // Map API progress (0-100) to overall progress (20-100)
                    const overallProgress = 20 + (apiProgress * 0.8);
                    setModelLoadProgress(overallProgress);
                    onProgress?.(overallProgress);
                }
            );

            setModelLoadProgress(100);
            onProgress?.(100);

            return result;
        } catch (error) {
            console.error('Upscale error:', error);

            // Re-throw with user-friendly message
            if (error instanceof Error) {
                throw error;
            }

            throw new Error('❌ Upscaling failed. Please try again.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setModelLoadProgress(0), 1000);
        }
    }, [checkBackendHealth]);

    return {
        upscale,
        modelLoadProgress,
        isLoading,
    };
}
