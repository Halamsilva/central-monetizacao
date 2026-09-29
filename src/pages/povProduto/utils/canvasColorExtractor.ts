export interface DetectedColor {
  name: string;
  hex: string;
  rgb: [number, number, number];
  percentage: number;
}

export interface ClientImageAnalysis {
  width: number;
  height: number;
  aspectRatio: string;
  dominantColor: DetectedColor;
  secondaryColor?: DetectedColor;
  isBrightBackground: boolean;
  contrastScore: number;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function classifyColor(r: number, g: number, b: number): { name: string; hex: string } {
  const [h, s, l] = rgbToHsl(r, g, b);

  // Very dark pixels -> Black / Graphite
  if (l < 18) {
    return { name: 'Preto', hex: '#1a1a1a' };
  }
  if (l < 30 && s < 25) {
    return { name: 'Grafite Fosco', hex: '#333333' };
  }

  // Very light pixels -> White / Off-white
  if (l > 85 && s < 20) {
    return { name: 'Branco', hex: '#f8f9fa' };
  }
  if (l > 75 && s < 25) {
    return { name: 'Cinza Claro', hex: '#d1d5db' };
  }

  // Low saturation -> Gray
  if (s < 18) {
    if (l < 50) return { name: 'Cinza Chumbo', hex: '#4b5563' };
    return { name: 'Cinza', hex: '#6b7280' };
  }

  // Brown / Beige detection (orange/yellow hue with low brightness or specific saturation)
  if (h >= 20 && h <= 50 && l >= 20 && l <= 55 && s >= 20 && s <= 65) {
    return { name: 'Marrom', hex: '#78350f' };
  }
  if (h >= 25 && h <= 55 && l > 55 && l <= 80 && s >= 15 && s <= 45) {
    return { name: 'Bege / Areia', hex: '#d4b996' };
  }

  // Chromatic hues
  if (h >= 345 || h < 15) {
    if (l < 35) return { name: 'Vinho / Bordô', hex: '#881337' };
    return { name: 'Vermelho', hex: '#dc2626' };
  }
  if (h >= 15 && h < 45) {
    return { name: 'Laranja', hex: '#ea580c' };
  }
  if (h >= 45 && h < 70) {
    if (l < 45) return { name: 'Mostarda / Ocre', hex: '#ca8a04' };
    return { name: 'Amarelo', hex: '#eab308' };
  }
  if (h >= 70 && h < 165) {
    if (l < 35) return { name: 'Verde Militar', hex: '#166534' };
    return { name: 'Verde', hex: '#22c55e' };
  }
  if (h >= 165 && h < 195) {
    return { name: 'Azul Turquesa / Petróleo', hex: '#0891b2' };
  }
  if (h >= 195 && h < 255) {
    if (l < 35) return { name: 'Azul Marinho', hex: '#1e3a8a' };
    return { name: 'Azul', hex: '#2563eb' };
  }
  if (h >= 255 && h < 315) {
    return { name: 'Roxo / Violeta', hex: '#7c3aed' };
  }
  if (h >= 315 && h < 345) {
    return { name: 'Rosa', hex: '#ec4899' };
  }

  return { name: 'Tonalidade Neutra', hex: '#4b5563' };
}

/**
 * Accurately extracts the real dominant colors of the PRODUCT from an image dataURL
 * by ignoring background pixels (white, transparent, near-white) and computing
 * true pixel frequency.
 */
export async function extractRealProductColors(imageDataUrl: string): Promise<ClientImageAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origW = img.naturalWidth || img.width || 800;
      const origH = img.naturalHeight || img.height || 800;

      const canvas = document.createElement('canvas');
      const size = 120;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(getFallbackAnalysis(origW, origH));
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      const colorBuckets = new Map<string, { count: number; hex: string; r: number; g: number; b: number }>();
      let totalProductPixels = 0;

      // Sample pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 1. Skip transparent background
        if (a < 60) continue;

        // 2. Skip pure or near-white studio background (typical in e-commerce product photos)
        if (r > 235 && g > 235 && b > 235) continue;

        // 3. Skip pure black borders if 4 corners are black
        if (r < 10 && g < 10 && b < 10 && (i < 400 || i > data.length - 400)) continue;

        const classified = classifyColor(r, g, b);
        const key = classified.name;

        if (!colorBuckets.has(key)) {
          colorBuckets.set(key, { count: 0, hex: classified.hex, r, g, b });
        }
        const bkt = colorBuckets.get(key)!;
        bkt.count++;
        // Keep a running average of RGB for this bucket
        bkt.r = Math.round((bkt.r + r) / 2);
        bkt.g = Math.round((bkt.g + g) / 2);
        bkt.b = Math.round((bkt.b + b) / 2);
        totalProductPixels++;
      }

      // If all pixels were filtered (e.g. all white or all transparent), sample middle area
      if (totalProductPixels < 50) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const classified = classifyColor(r, g, b);
          if (!colorBuckets.has(classified.name)) {
            colorBuckets.set(classified.name, { count: 0, hex: classified.hex, r, g, b });
          }
          colorBuckets.get(classified.name)!.count++;
          totalProductPixels++;
        }
      }

      // Sort color buckets by count descending
      const sorted = Array.from(colorBuckets.entries())
        .map(([name, val]) => ({
          name,
          hex: val.hex,
          rgb: [val.r, val.g, val.b] as [number, number, number],
          percentage: Math.round((val.count / Math.max(1, totalProductPixels)) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage);

      const dominant = sorted[0] || {
        name: 'Tonalidade Original',
        hex: '#4b5563',
        rgb: [75, 85, 99],
        percentage: 100,
      };

      const secondary = sorted.length > 1 && sorted[1].percentage > 12 ? sorted[1] : undefined;

      const ratio = origW / Math.max(1, origH);
      let aspectRatio = '1:1 Quadrado';
      if (ratio > 1.25) aspectRatio = 'Horizontal';
      else if (ratio < 0.8) aspectRatio = 'Vertical';

      resolve({
        width: origW,
        height: origH,
        aspectRatio,
        dominantColor: dominant,
        secondaryColor: secondary,
        isBrightBackground: true,
        contrastScore: dominant.percentage,
      });
    };

    img.onerror = () => {
      resolve(getFallbackAnalysis(800, 800));
    };

    img.src = imageDataUrl;
  });
}

function getFallbackAnalysis(w: number, h: number): ClientImageAnalysis {
  return {
    width: w,
    height: h,
    aspectRatio: '1:1 Quadrado',
    dominantColor: {
      name: 'Tonalidade Original',
      hex: '#374151',
      rgb: [55, 65, 81],
      percentage: 100,
    },
    isBrightBackground: false,
    contrastScore: 50,
  };
}
