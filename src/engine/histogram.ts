/**
 * APEX Photo Studio - Histogram Analysis Engine
 * Real-time histogram and image analysis tools
 */

import type { HistogramData, ImageStatistics } from '@/types';

/**
 * Calculate RGB and luminance histograms
 */
export function calculateHistogram(imageData: ImageData): HistogramData {
  const { data } = imageData;
  
  const red = new Array<number>(256).fill(0);
  const green = new Array<number>(256).fill(0);
  const blue = new Array<number>(256).fill(0);
  const luminance = new Array<number>(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    red[r]++;
    green[g]++;
    blue[b]++;
    
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    luminance[Math.min(255, lum)]++;
  }
  
  let max = 0;
  for (let i = 5; i < 251; i++) {
    max = Math.max(max, red[i], green[i], blue[i], luminance[i]);
  }
  
  return { red, green, blue, luminance, max };
}

/**
 * Fast histogram for real-time preview (samples every Nth pixel)
 */
export function calculateHistogramFast(
  imageData: ImageData, 
  sampleRate: number = 4
): HistogramData {
  const { data } = imageData;
  
  const red = new Array<number>(256).fill(0);
  const green = new Array<number>(256).fill(0);
  const blue = new Array<number>(256).fill(0);
  const luminance = new Array<number>(256).fill(0);
  
  const step = sampleRate * 4;
  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    red[r]++;
    green[g]++;
    blue[b]++;
    
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    luminance[Math.min(255, lum)]++;
  }
  
  let max = 0;
  for (let i = 5; i < 251; i++) {
    max = Math.max(max, red[i], green[i], blue[i], luminance[i]);
  }
  
  return { red, green, blue, luminance, max };
}

/**
 * Detect clipping in highlights and shadows
 */
export function detectClipping(
  imageData: ImageData,
  highThreshold: number = 250,
  lowThreshold: number = 5
): { highlightClipping: number; shadowClipping: number } {
  const { data } = imageData;
  const totalPixels = data.length / 4;
  
  let highlightClipped = 0;
  let shadowClipped = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r >= highThreshold || g >= highThreshold || b >= highThreshold) {
      highlightClipped++;
    }
    
    if (r <= lowThreshold && g <= lowThreshold && b <= lowThreshold) {
      shadowClipped++;
    }
  }
  
  return {
    highlightClipping: (highlightClipped / totalPixels) * 100,
    shadowClipping: (shadowClipped / totalPixels) * 100,
  };
}

/**
 * Create mask for zebra overlay visualization
 */
export function createClippingMask(
  imageData: ImageData,
  highThreshold: number = 250,
  lowThreshold: number = 5
): Uint8Array {
  const { data } = imageData;
  const pixelCount = data.length / 4;
  const mask = new Uint8Array(pixelCount);
  
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r >= highThreshold || g >= highThreshold || b >= highThreshold) {
      mask[pixelIndex] = 1;
    } else if (r <= lowThreshold && g <= lowThreshold && b <= lowThreshold) {
      mask[pixelIndex] = 2;
    }
  }
  
  return mask;
}

/**
 * Calculate image statistics
 */
export function calculateStatistics(imageData: ImageData): ImageStatistics {
  const { data } = imageData;
  const pixelCount = data.length / 4;
  
  let sumR = 0, sumG = 0, sumB = 0, sumL = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    sumR += r;
    sumG += g;
    sumB += b;
    sumL += l;
  }
  
  const mean = {
    r: sumR / pixelCount,
    g: sumG / pixelCount,
    b: sumB / pixelCount,
    l: sumL / pixelCount,
  };
  
  let varR = 0, varG = 0, varB = 0, varL = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    varR += (r - mean.r) ** 2;
    varG += (g - mean.g) ** 2;
    varB += (b - mean.b) ** 2;
    varL += (l - mean.l) ** 2;
  }
  
  const stdDev = {
    r: Math.sqrt(varR / pixelCount),
    g: Math.sqrt(varG / pixelCount),
    b: Math.sqrt(varB / pixelCount),
    l: Math.sqrt(varL / pixelCount),
  };
  
  const { highlightClipping, shadowClipping } = detectClipping(imageData);
  
  return {
    mean,
    median: mean,
    stdDev,
    clippedHighlights: highlightClipping,
    clippedShadows: shadowClipping,
  };
}

/**
 * Render histogram to canvas with RGB channels
 */
export function renderHistogram(
  ctx: CanvasRenderingContext2D,
  histogram: HistogramData,
  width: number,
  height: number,
  options: {
    showRed?: boolean;
    showGreen?: boolean;
    showBlue?: boolean;
    showLuminance?: boolean;
  } = {}
): void {
  const { showRed = true, showGreen = true, showBlue = true, showLuminance = false } = options;
  
  ctx.clearRect(0, 0, width, height);
  
  const binWidth = width / 256;
  const { max } = histogram;
  
  if (max === 0) return;
  
  const drawChannel = (channel: number[], color: string, alpha: number = 0.5): void => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    for (let i = 0; i < 256; i++) {
      const x = i * binWidth;
      const y = height - (channel[i] / max) * height;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = color.replace('1)', `${alpha})`);
    ctx.fill();
  };
  
  if (showBlue) drawChannel(histogram.blue, 'rgba(66, 133, 244, 1)', 0.5);
  if (showGreen) drawChannel(histogram.green, 'rgba(52, 211, 153, 1)', 0.5);
  if (showRed) drawChannel(histogram.red, 'rgba(239, 68, 68, 1)', 0.5);
  
  if (showLuminance) {
    ctx.beginPath();
    ctx.moveTo(0, height - (histogram.luminance[0] / max) * height);
    for (let i = 1; i < 256; i++) {
      ctx.lineTo(i * binWidth, height - (histogram.luminance[i] / max) * height);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
