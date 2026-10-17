/**
 * Utility per la compressione lato client delle immagini caricate dagli utenti (es. foto segnalazioni).
 * Riduce la risoluzione (max 1280px) e applica compressione JPEG a qualità controllata (~0.8),
 * riducendo il payload del 90-95% senza perdita visibile di dettagli.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // Da 0.1 a 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Il file fornito non è un\'immagine valida.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calcola il ridimensionamento proporzionale mantenendo le proporzioni
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossibile ottenere il contesto 2D del canvas.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Disegna l'immagine scalata sul canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Converte in base64 compresso
      try {
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Errore durante il caricamento dell\'immagine.'));
    };

    img.src = objectUrl;
  });
};

export const compressMultipleImages = async (
  files: File[],
  options?: CompressionOptions
): Promise<string[]> => {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
};
