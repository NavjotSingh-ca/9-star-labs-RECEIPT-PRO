import { load } from 'exifreader';

/** Laplacian variance blur detection via greyscale canvas convolution */
export async function computeBlurScore(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 200;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(999);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      // Convert to greyscale
      const grey: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      // Laplacian kernel: [0,1,0,1,-4,1,0,1,0]
      let sumSq = 0;
      let count = 0;
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const idx = y * size + x;
          const lap =
            grey[idx - size] +
            grey[idx + size] +
            grey[idx - 1] +
            grey[idx + 1] -
            4 * grey[idx];
          sumSq += lap * lap;
          count++;
        }
      }
      resolve(count > 0 ? sumSq / count : 999);
    };
    img.onerror = () => resolve(999);
    img.src = dataUrl;
  });
}

/**
 * Reads a File object and returns its contents as a data URL string.
 * @throws {Error} If the FileReader fails to read the file.
 */
export async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file. The file may be corrupted or inaccessible.'));
    reader.readAsDataURL(file);
  });
}
/**
 * Resize an image to fit within maxDimension, correcting EXIF orientation.
 * Reads the EXIF Orientation tag from the raw image bytes, then applies the
 * appropriate canvas transform (rotate/flip) so the output JPEG is always
 * visually upright regardless of how the camera stored the pixels.
 *
 * Orientation → transform mapping (EXIF tag 274):
 *   1 = none, 2 = flip H, 3 = rotate 180°, 4 = flip V,
 *   5 = transpose, 6 = rotate 90° CW, 7 = transverse, 8 = rotate 270° CW
 *
 * @param dataUrl - Source image as a data URL
 * @param maxDimension - Longest side in pixels
 * @param quality - JPEG quality 0.0–1.0
 * @param outputMimeType - Output MIME type (default: 'image/jpeg')
 * @returns Resized and EXIF-corrected image as a data URL
 * @throws {Error} If canvas is unavailable or image cannot be loaded
 */
export async function resizeImage(
  dataUrl: string,
  maxDimension: number,
  quality: number,
  outputMimeType = 'image/jpeg'
): Promise<string> {
  // ── 1. Read EXIF orientation from raw bytes ──
  let orientation = 1; // default: no transform
  try {
    const base64 = dataUrl.split(',')[1];
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const tags = load(bytes.buffer);
    const v = tags?.Orientation?.value;
    if (typeof v === 'number' && v >= 1 && v <= 8) orientation = v;
  } catch { /* EXIF unavailable or unparseable — keep default */ }

  // ── 2. Load image ──
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // For orientations 5–8 the browser already swapped width/height,
      // so naturalWidth/naturalHeight reflect the display orientation.
      // We undo that here so drawImage gets the raw pixel dimensions.
      const isSwapped = [5, 6, 7, 8].includes(orientation);
      const rawW = isSwapped ? img.naturalHeight : img.naturalWidth;
      const rawH = isSwapped ? img.naturalWidth : img.naturalHeight;

      let drawW = rawW;
      let drawH = rawH;
      const longest = Math.max(rawW, rawH);
      if (longest > maxDimension) {
        const scale = maxDimension / longest;
        drawW = Math.round(rawW * scale);
        drawH = Math.round(rawH * scale);
      }

      // Canvas logical size: swap for rotated orientations
      const cw = isSwapped ? drawH : drawW;
      const ch = isSwapped ? drawW : drawH;

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas is not available.'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // ── 3. Apply EXIF orientation transform ──
      ctx.save();
      switch (orientation) {
        case 1: /* none */ break;
        case 2: ctx.translate(cw, 0); ctx.scale(-1, 1); break;
        case 3: ctx.translate(cw, ch); ctx.rotate(Math.PI); break;
        case 4: ctx.translate(0, ch); ctx.scale(1, -1); break;
        case 5: ctx.rotate(Math.PI / 2); ctx.scale(1, -1); break;
        case 6: ctx.rotate(Math.PI / 2); ctx.translate(0, -ch); break;
        case 7: ctx.rotate(Math.PI / 2); ctx.translate(cw, -ch); ctx.scale(-1, 1); break;
        case 8: ctx.rotate(-Math.PI / 2); ctx.translate(-cw, 0); break;
      }

      ctx.drawImage(img, 0, 0, drawW, drawH);
      ctx.restore();

      // ── 4. Output as correctly-oriented JPEG ──
      resolve(canvas.toDataURL(outputMimeType, quality));
    };
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = dataUrl;
  });
}

/**
 * Returns the natural pixel dimensions of an image.
 * Useful for validating minimum resolution before AI processing.
 *
 * @param dataUrl - Source image as a data URL
 * @returns Object with width and height in pixels
 * @throws {Error} If the image cannot be loaded
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not load image for dimension check. The file may be corrupted.'));
    img.src = dataUrl;
  });
}
