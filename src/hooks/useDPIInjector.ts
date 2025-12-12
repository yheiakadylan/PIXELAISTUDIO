import { useState, useCallback } from 'react';

interface DPIInjectorResult {
    injectDPI: (blob: Blob, dpi: number) => Promise<Blob>;
    isProcessing: boolean;
    error: string | null;
}

/**
 * Hook for injecting DPI metadata into image files
 * Supports PNG and JPEG formats
 */
export const useDPIInjector = (): DPIInjectorResult => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Inject DPI into PNG format
     * PNG uses pHYs chunk to store physical pixel dimensions
     */
    const injectPNGDPI = useCallback(async (blob: Blob, dpi: number): Promise<Blob> => {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // PNG signature
        const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

        // Verify PNG signature
        for (let i = 0; i < PNG_SIGNATURE.length; i++) {
            if (uint8Array[i] !== PNG_SIGNATURE[i]) {
                throw new Error('Not a valid PNG file');
            }
        }

        // Convert DPI to pixels per meter (PNG stores in pixels/meter)
        const pixelsPerMeter = Math.round(dpi * 39.3701); // 1 inch = 39.3701 cm = 0.393701 meters

        // Create pHYs chunk
        const pHYs = new Uint8Array(21);
        pHYs[0] = 0; // Length byte 1
        pHYs[1] = 0; // Length byte 2
        pHYs[2] = 0; // Length byte 3
        pHYs[3] = 9; // Length byte 4 (9 bytes of data)
        pHYs[4] = 112; // 'p'
        pHYs[5] = 72; // 'H'
        pHYs[6] = 89; // 'Y'
        pHYs[7] = 115; // 's'

        // Pixels per unit, X axis (4 bytes, big-endian)
        pHYs[8] = (pixelsPerMeter >>> 24) & 0xff;
        pHYs[9] = (pixelsPerMeter >>> 16) & 0xff;
        pHYs[10] = (pixelsPerMeter >>> 8) & 0xff;
        pHYs[11] = pixelsPerMeter & 0xff;

        // Pixels per unit, Y axis (4 bytes, big-endian)
        pHYs[12] = (pixelsPerMeter >>> 24) & 0xff;
        pHYs[13] = (pixelsPerMeter >>> 16) & 0xff;
        pHYs[14] = (pixelsPerMeter >>> 8) & 0xff;
        pHYs[15] = pixelsPerMeter & 0xff;

        // Unit specifier (1 = meter)
        pHYs[16] = 1;

        // CRC placeholder (will calculate)
        const crc = calculateCRC(pHYs.slice(4, 17));
        pHYs[17] = (crc >>> 24) & 0xff;
        pHYs[18] = (crc >>> 16) & 0xff;
        pHYs[19] = (crc >>> 8) & 0xff;
        pHYs[20] = crc & 0xff;

        // Insert pHYs chunk after PNG signature and IHDR chunk
        const result = new Uint8Array(uint8Array.length + 21);

        // Find IHDR chunk end
        let ihdrEnd = 8; // Start after signature
        const ihdrLength = (uint8Array[8] << 24) | (uint8Array[9] << 16) | (uint8Array[10] << 8) | uint8Array[11];
        ihdrEnd += 12 + ihdrLength; // Length(4) + Type(4) + Data + CRC(4)

        // Copy data before pHYs insertion point
        result.set(uint8Array.slice(0, ihdrEnd), 0);
        // Insert pHYs chunk
        result.set(pHYs, ihdrEnd);
        // Copy rest of data
        result.set(uint8Array.slice(ihdrEnd), ihdrEnd + 21);

        return new Blob([result], { type: 'image/png' });
    }, []);

    /**
     * Inject DPI into JPEG format
     * JPEG uses JFIF APP0 marker or EXIF data
     */
    const injectJPEGDPI = useCallback(async (blob: Blob, dpi: number): Promise<Blob> => {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // JPEG starts with FF D8
        if (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8) {
            throw new Error('Not a valid JPEG file');
        }

        // Find JFIF APP0 marker (FF E0)
        let offset = 2;
        let foundJFIF = false;

        while (offset < uint8Array.length - 1) {
            if (uint8Array[offset] === 0xff && uint8Array[offset + 1] === 0xe0) {
                // Check if it's JFIF
                const identifier = String.fromCharCode(...Array.from(uint8Array.slice(offset + 4, offset + 9)));
                if (identifier === 'JFIF\0') {
                    foundJFIF = true;
                    // Modify DPI values
                    // Density units (1 = dpi)
                    uint8Array[offset + 13] = 1;
                    // X density
                    uint8Array[offset + 14] = (dpi >>> 8) & 0xff;
                    uint8Array[offset + 15] = dpi & 0xff;
                    // Y density
                    uint8Array[offset + 16] = (dpi >>> 8) & 0xff;
                    uint8Array[offset + 17] = dpi & 0xff;
                    break;
                }
            }
            offset++;
        }

        if (!foundJFIF) {
            // Create new JFIF APP0 marker if not found
            const jfifMarker = new Uint8Array(18);
            jfifMarker[0] = 0xff; // Marker
            jfifMarker[1] = 0xe0; // APP0
            jfifMarker[2] = 0x00; // Length high byte
            jfifMarker[3] = 0x10; // Length low byte (16)
            jfifMarker[4] = 0x4a; // 'J'
            jfifMarker[5] = 0x46; // 'F'
            jfifMarker[6] = 0x49; // 'I'
            jfifMarker[7] = 0x46; // 'F'
            jfifMarker[8] = 0x00; // NULL
            jfifMarker[9] = 0x01; // Version major
            jfifMarker[10] = 0x01; // Version minor
            jfifMarker[11] = 0x01; // Density units (1 = dpi)
            jfifMarker[12] = (dpi >>> 8) & 0xff; // X density high
            jfifMarker[13] = dpi & 0xff; // X density low
            jfifMarker[14] = (dpi >>> 8) & 0xff; // Y density high
            jfifMarker[15] = dpi & 0xff; // Y density low
            jfifMarker[16] = 0x00; // Thumbnail width
            jfifMarker[17] = 0x00; // Thumbnail height

            // Insert after SOI marker
            const result = new Uint8Array(uint8Array.length + 18);
            result.set(uint8Array.slice(0, 2), 0); // SOI
            result.set(jfifMarker, 2); // JFIF APP0
            result.set(uint8Array.slice(2), 20); // Rest of data

            return new Blob([result], { type: 'image/jpeg' });
        }

        return new Blob([uint8Array], { type: 'image/jpeg' });
    }, []);

    /**
     * Main function to inject DPI
     */
    const injectDPI = useCallback(async (blob: Blob, dpi: number): Promise<Blob> => {
        setIsProcessing(true);
        setError(null);

        try {
            if (blob.type === 'image/png') {
                const result = await injectPNGDPI(blob, dpi);
                setIsProcessing(false);
                return result;
            } else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
                const result = await injectJPEGDPI(blob, dpi);
                setIsProcessing(false);
                return result;
            } else if (blob.type === 'image/webp') {
                // WEBP doesn't support DPI metadata in the same way
                // Return as-is
                console.warn('WEBP format does not support DPI metadata modification');
                setIsProcessing(false);
                return blob;
            } else {
                throw new Error(`Unsupported format: ${blob.type}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setIsProcessing(false);
            throw err;
        }
    }, [injectPNGDPI, injectJPEGDPI]);

    return { injectDPI, isProcessing, error };
};

/**
 * Calculate CRC32 for PNG chunks
 */
function calculateCRC(data: Uint8Array): number {
    let crc = 0xffffffff;

    for (let i = 0; i < data.length; i++) {
        crc = crc ^ data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xedb88320;
            } else {
                crc = crc >>> 1;
            }
        }
    }

    return crc ^ 0xffffffff;
}
