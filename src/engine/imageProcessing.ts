/**
 * APEX Photo Studio - Core Image Processing Engine
 * 
 * Main entry point for all image processing operations.
 * Orchestrates the adjustment pipeline and manages processing state.
 */

import type { AdjustmentSettings, BasicAdjustments, ColorAdjustments } from '@/types';
import { clamp, normalizeRgb, denormalizeRgb } from '@/utils/colorspace';
import { 
  adjustHighlights, 
  adjustShadows, 
  adjustWhites, 
  adjustBlacks,
  adjustTemperature,
  adjustTint,
  adjustVibrance,
  adjustSaturation 
} from './adjustments';

/**
 * Clone ImageData for non-destructive editing
 */
export function cloneImageData(source: ImageData): ImageData {
  const clone = new ImageData(source.width, source.height);
  clone.data.set(source.data);
  return clone;
}

/**
 * Process a single pixel with all basic adjustments
 */
function processPixel(
  r: number, g: number, b: number,
  basic: BasicAdjustments,
  color: ColorAdjustments
): { r: number; g: number; b: number } {
  let rgb = normalizeRgb(r, g, b);
  
  // 1. Temperature
  rgb = adjustTemperature(rgb, color.temperature);
  
  // 2. Tint
  rgb = adjustTint(rgb, color.tint);
  
  // 3. Exposure
  const expMultiplier = Math.pow(2, basic.exposure);
  rgb = {
    r: clamp(rgb.r * expMultiplier, 0, 1),
    g: clamp(rgb.g * expMultiplier, 0, 1),
    b: clamp(rgb.b * expMultiplier, 0, 1),
  };
  
  // 4. Contrast
  if (basic.contrast !== 0) {
    const factor = (basic.contrast + 100) / 100;
    rgb = {
      r: clamp((rgb.r - 0.5) * factor + 0.5, 0, 1),
      g: clamp((rgb.g - 0.5) * factor + 0.5, 0, 1),
      b: clamp((rgb.b - 0.5) * factor + 0.5, 0, 1),
    };
  }
  
  // 5. Tonal adjustments
  rgb = adjustHighlights(rgb, basic.highlights);
  rgb = adjustShadows(rgb, basic.shadows);
  rgb = adjustWhites(rgb, basic.whites);
  rgb = adjustBlacks(rgb, basic.blacks);
  
  // 6. Vibrance & Saturation
  rgb = adjustVibrance(rgb, color.vibrance);
  rgb = adjustSaturation(rgb, color.saturation);
  
  return denormalizeRgb(rgb);
}

/**
 * Process entire image with adjustments
 */
export function processImage(
  source: ImageData,
  settings: AdjustmentSettings
): ImageData {
  const { data, width, height } = source;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  const { basic, color } = settings;
  
  for (let i = 0; i < data.length; i += 4) {
    const result = processPixel(
      data[i], data[i + 1], data[i + 2],
      basic, color
    );
    
    outData[i] = result.r;
    outData[i + 1] = result.g;
    outData[i + 2] = result.b;
    outData[i + 3] = data[i + 3];
  }
  
  return output;
}

/**
 * Process image in tiles for large images
 */
export function processImageTiled(
  source: ImageData,
  settings: AdjustmentSettings,
  tileSize: number = 256,
  onProgress?: (progress: number) => void
): ImageData {
  const { data, width, height } = source;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  const { basic, color } = settings;
  
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);
  const totalTiles = tilesX * tilesY;
  let completedTiles = 0;
  
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const startX = tx * tileSize;
      const startY = ty * tileSize;
      const endX = Math.min(startX + tileSize, width);
      const endY = Math.min(startY + tileSize, height);
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const i = (y * width + x) * 4;
          
          const result = processPixel(
            data[i], data[i + 1], data[i + 2],
            basic, color
          );
          
          outData[i] = result.r;
          outData[i + 1] = result.g;
          outData[i + 2] = result.b;
          outData[i + 3] = data[i + 3];
        }
      }
      
      completedTiles++;
      onProgress?.(completedTiles / totalTiles);
    }
  }
  
  return output;
}

/**
 * Apply gaussian blur for clarity/sharpening
 */
export function applyGaussianBlur(
  source: ImageData,
  radius: number
): ImageData {
  const { data, width, height } = source;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  // Generate gaussian kernel
  const size = Math.ceil(radius * 3) * 2 + 1;
  const kernel: number[] = [];
  const sigma = radius / 3;
  let sum = 0;
  
  for (let i = 0; i < size; i++) {
    const x = i - Math.floor(size / 2);
    const g = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(g);
    sum += g;
  }
  
  // Normalize kernel
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  
  // Horizontal pass
  const temp = new Float32Array(data.length);
  const halfSize = Math.floor(size / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let k = 0; k < size; k++) {
        const sx = clamp(x + k - halfSize, 0, width - 1);
        const i = (y * width + sx) * 4;
        r += data[i] * kernel[k];
        g += data[i + 1] * kernel[k];
        b += data[i + 2] * kernel[k];
      }
      
      const i = (y * width + x) * 4;
      temp[i] = r;
      temp[i + 1] = g;
      temp[i + 2] = b;
      temp[i + 3] = data[i + 3];
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let k = 0; k < size; k++) {
        const sy = clamp(y + k - halfSize, 0, height - 1);
        const i = (sy * width + x) * 4;
        r += temp[i] * kernel[k];
        g += temp[i + 1] * kernel[k];
        b += temp[i + 2] * kernel[k];
      }
      
      const i = (y * width + x) * 4;
      outData[i] = clamp(Math.round(r), 0, 255);
      outData[i + 1] = clamp(Math.round(g), 0, 255);
      outData[i + 2] = clamp(Math.round(b), 0, 255);
      outData[i + 3] = temp[i + 3];
    }
  }
  
  return output;
}

/**
 * Apply unsharp mask for sharpening
 */
export function applyUnsharpMask(
  source: ImageData,
  amount: number,
  radius: number,
  threshold: number
): ImageData {
  const blurred = applyGaussianBlur(source, radius);
  const { data, width, height } = source;
  const blurData = blurred.data;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  const factor = amount / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = data[i + c];
      const blur = blurData[i + c];
      const diff = orig - blur;
      
      if (Math.abs(diff) > threshold) {
        outData[i + c] = clamp(Math.round(orig + diff * factor), 0, 255);
      } else {
        outData[i + c] = orig;
      }
    }
    outData[i + 3] = data[i + 3];
  }
  
  return output;
}
