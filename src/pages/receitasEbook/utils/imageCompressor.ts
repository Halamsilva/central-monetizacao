/**
 * Utility to compress and optimize images before uploading
 * Converts high-resolution smartphone/camera photos (5-20MB) into clean, fast web-optimized Base64 strings (100-300KB)
 * to prevent server 413 Payload Too Large and Gateway Timeouts.
 */

export interface CompressedImageResult {
  base64: string;
  mimeType: string;
  sizeBytes: number;
}

export async function compressImageFile(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If it's not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // If image is very small (under 250KB), no need to compress through canvas
      if (file.size < 250 * 1024) {
        const cleanBase64 = dataUrl.split(',')[1] || dataUrl;
        return resolve({
          base64: cleanBase64,
          mimeType: file.type || 'image/jpeg',
          sizeBytes: file.size
        });
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to original data if canvas load fails
        const cleanBase64 = dataUrl.split(',')[1] || dataUrl;
        resolve({
          base64: cleanBase64,
          mimeType: file.type || 'image/jpeg',
          sizeBytes: file.size
        });
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const cleanBase64 = dataUrl.split(',')[1] || dataUrl;
          return resolve({
            base64: cleanBase64,
            mimeType: file.type || 'image/jpeg',
            sizeBytes: file.size
          });
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to web-friendly JPEG
        const outputMime = 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputMime, quality);
        const cleanBase64 = compressedDataUrl.split(',')[1] || compressedDataUrl;

        // Estimate size in bytes
        const sizeBytes = Math.round((cleanBase64.length * 3) / 4);

        resolve({
          base64: cleanBase64,
          mimeType: outputMime,
          sizeBytes
        });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
