/**
 * imageCompressionService.ts
 * Servizio di compressione e ridimensionamento immagini lato client su HTML5 Canvas.
 * Riduce foto da 5-12 MB a ~100-250 KB preservando nitidezza e aspect ratio,
 * velocizzando notevolmente upload, sincronizzazione e riducendo il carico di memoria.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // es: 0.15 = 85% ridotto
  width: number;
  height: number;
}

/**
 * Ridimensiona e comprime un file immagine (File o Blob)
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcolo dimensioni mantenendo aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Creazione canvas offscreen
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback alla lettura standard
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Disegna con interpolazione di alta qualità
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Estrazione in dataURL compresso
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Calcolo approssimativo della dimensione del dataURL base64 in byte
        const head = `data:${mimeType};base64,`;
        const base64Len = dataUrl.length - head.length;
        const compressedSize = Math.round((base64Len * 3) / 4);
        const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          compressionRatio,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Impossibile elaborare il file immagine.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Errore durante la lettura del file.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formatta i byte in formato leggibile (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
