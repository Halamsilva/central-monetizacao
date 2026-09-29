export const fileToCompressedDataUrl = async (
  file: File,
  maxSide = 1600,
  quality = 0.82
): Promise<string> => {
  const readAsDataUrl = (source: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Nao consegui ler a imagem.'));
      reader.readAsDataURL(source);
    });

  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return readAsDataUrl(file);
  }

  const dataUrl = await readAsDataUrl(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Imagem invalida.'));
      element.src = dataUrl;
    });

    const scale = Math.min(1, maxSide / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * scale));
    const height = Math.max(1, Math.round((image.height || 1) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return dataUrl;

    context.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL('image/jpeg', quality);

    return compressed.length < dataUrl.length ? compressed : dataUrl;
  } catch {
    return dataUrl;
  }
};
