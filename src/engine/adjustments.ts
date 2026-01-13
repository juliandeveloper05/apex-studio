/**
 * APEX Photo Studio - Image Adjustment Algorithms
 * 
 * Professional-grade image adjustment algorithms implementing:
 * - Exposure compensation (EV-based)
 * - Contrast (S-curve based)
 * - Highlights/Shadows/Whites/Blacks (luminance-masked)
 * - Temperature and Tint (color balance)
 * - Vibrance and Saturation
 * - Clarity (local contrast)
 * 
 * All algorithms are designed for real-time processing with
 * 16-bit precision conceptually (though limited by canvas 8-bit).
 */

import { 
  rgbToHsl, 
  hslToRgb, 
  kelvinToRgb,
  getLuminance,
  clamp,
  normalizeRgb,
  denormalizeRgb,
  type RGB,
} from '@/utils/colorspace';

import type { BasicAdjustments, ColorAdjustments } from '@/types';

// ============================================================================
// LOOKUP TABLE (LUT) GENERATION
// ============================================================================

/**
 * Pre-compute a lookup table for a given transfer function
 * LUTs dramatically speed up per-pixel operations
 * 
 * @param fn - Transfer function mapping 0-255 to 0-255
 * @returns 256-entry lookup table
 */
export function createLUT(fn: (value: number) => number): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(clamp(fn(i), 0, 255));
  }
  return lut;
}

// ============================================================================
// EXPOSURE ADJUSTMENT
// ============================================================================

/**
 * Adjust exposure using EV (Exposure Value) system
 * 
 * Photography theory:
 * Each +1 EV doubles the light, each -1 EV halves it.
 * This is a multiplicative operation in linear light space.
 * 
 * For gamma-encoded values, we use a power function approximation
 * that gives similar perceptual results without full linearization.
 * 
 * @param value - Input pixel value (0-255)
 * @param ev - Exposure compensation (-5 to +5 EV)
 * @returns Adjusted value (0-255)
 */
export function adjustExposureValue(value: number, ev: number): number {
  if (ev === 0) return value;
  
  // EV to multiplier: 2^EV
  const multiplier = Math.pow(2, ev);
  
  // Apply in a way that preserves highlights better
  // Using a soft compression for high values
  const normalized = value / 255;
  let adjusted = normalized * multiplier;
  
  // Soft highlight rolloff to prevent harsh clipping
  if (adjusted > 1) {
    // Shoulder curve for highlight compression
    adjusted = 1 - Math.exp(1 - adjusted);
  }
  
  return clamp(adjusted * 255, 0, 255);
}

/**
 * Create exposure adjustment LUT
 */
export function createExposureLUT(ev: number): Uint8Array {
  return createLUT((v) => adjustExposureValue(v, ev));
}

// ============================================================================
// CONTRAST ADJUSTMENT
// ============================================================================

/**
 * Adjust contrast using S-curve transformation
 * 
 * Photography theory:
 * Contrast is the difference between lights and darks.
 * Positive contrast stretches the histogram (more separation),
 * negative contrast compresses it (less separation).
 * 
 * We use a sigmoid (S-curve) function that:
 * - Preserves black and white points
 * - Symmetric around middle gray (128)
 * - Smooth, natural-looking result
 * 
 * @param value - Input pixel value (0-255)
 * @param amount - Contrast amount (-100 to +100)
 * @returns Adjusted value (0-255)
 */
export function adjustContrastValue(value: number, amount: number): number {
  if (amount === 0) return value;
  
  // Convert to -1 to +1 range, with neutral at 0.5
  const factor = (amount + 100) / 200; // 0 to 1
  
  // Calculate contrast factor (using tangent for S-curve steepness)
  const contrast = Math.tan((factor * 0.99 + 0.005) * Math.PI / 2);
  
  // Normalize to 0-1, center at 0.5, apply contrast, restore range
  const normalized = value / 255;
  const centered = normalized - 0.5;
  const adjusted = centered * contrast + 0.5;
  
  return clamp(adjusted * 255, 0, 255);
}

/**
 * Create contrast adjustment LUT
 */
export function createContrastLUT(amount: number): Uint8Array {
  return createLUT((v) => adjustContrastValue(v, amount));
}

// ============================================================================
// HIGHLIGHTS / SHADOWS / WHITES / BLACKS
// ============================================================================

/**
 * Creates a smooth luminance mask for selective adjustments
 * 
 * Photography theory:
 * These adjustments target specific tonal ranges:
 * - Highlights: Brightest areas (clouds, specular reflections)
 * - Shadows: Darkest areas (under furniture, shade)
 * - Whites: The very brightest pixels
 * - Blacks: The very darkest pixels
 * 
 * Each uses a gaussian-like mask that smoothly selects the target range.
 * 
 * @param luminance - Pixel luminance (0-1)
 * @param center - Center of the tonal range (0-1)
 * @param width - Width of the selection (0-1)
 * @returns Mask strength (0-1)
 */
function createTonalMask(luminance: number, center: number, width: number): number {
  const distance = Math.abs(luminance - center);
  return Math.max(0, 1 - distance / width);
}

/**
 * Adjust highlights (bright areas)
 * Positive: Brighten highlights
 * Negative: Recover/darken highlights
 */
export function adjustHighlights(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  const luminance = getLuminance(rgb);
  
  // Highlights target the upper 30% of the tonal range
  const mask = createTonalMask(luminance, 0.85, 0.3);
  
  // Amount scaled to useful range
  const adjustment = (amount / 100) * mask;
  
  // Apply as exposure-like adjustment
  const multiplier = 1 + adjustment * 0.5;
  
  return {
    r: clamp(rgb.r * multiplier, 0, 1),
    g: clamp(rgb.g * multiplier, 0, 1),
    b: clamp(rgb.b * multiplier, 0, 1),
  };
}

/**
 * Adjust shadows (dark areas)
 * Positive: Lift/brighten shadows
 * Negative: Deepen/darken shadows
 */
export function adjustShadows(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  const luminance = getLuminance(rgb);
  
  // Shadows target the lower 30% of the tonal range
  const mask = createTonalMask(luminance, 0.15, 0.3);
  
  const adjustment = (amount / 100) * mask;
  
  // For shadows, we add rather than multiply to lift the blacks
  const offset = adjustment * 0.3;
  
  return {
    r: clamp(rgb.r + offset, 0, 1),
    g: clamp(rgb.g + offset, 0, 1),
    b: clamp(rgb.b + offset, 0, 1),
  };
}

/**
 * Adjust whites (brightest pixels)
 * More targeted than highlights - just the extremes
 */
export function adjustWhites(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  const luminance = getLuminance(rgb);
  
  // Whites target the top 15% only
  const mask = createTonalMask(luminance, 0.95, 0.15);
  
  const adjustment = (amount / 100) * mask;
  const multiplier = 1 + adjustment * 0.3;
  
  return {
    r: clamp(rgb.r * multiplier, 0, 1),
    g: clamp(rgb.g * multiplier, 0, 1),
    b: clamp(rgb.b * multiplier, 0, 1),
  };
}

/**
 * Adjust blacks (darkest pixels)
 * More targeted than shadows - just the extremes
 */
export function adjustBlacks(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  const luminance = getLuminance(rgb);
  
  // Blacks target the bottom 15% only
  const mask = createTonalMask(luminance, 0.05, 0.15);
  
  const adjustment = (amount / 100) * mask;
  const offset = adjustment * 0.15;
  
  return {
    r: clamp(rgb.r + offset, 0, 1),
    g: clamp(rgb.g + offset, 0, 1),
    b: clamp(rgb.b + offset, 0, 1),
  };
}

// ============================================================================
// COLOR TEMPERATURE & TINT
// ============================================================================

/**
 * Adjust color temperature
 * 
 * Photography theory:
 * Color temperature describes the warmth/coolness of light.
 * - Low Kelvin (2000-4000): Warm (orange/yellow, candlelight)
 * - Mid Kelvin (5000-6500): Neutral (daylight)
 * - High Kelvin (7000+): Cool (blue, shade)
 * 
 * This adjustment simulates changing the white balance:
 * - Moving toward lower K warms the image (adds orange)
 * - Moving toward higher K cools the image (adds blue)
 * 
 * @param rgb - Input RGB (0-1)
 * @param kelvin - Target color temperature (2000-50000)
 * @param referenceKelvin - Reference/neutral temperature (default 6500)
 * @returns Adjusted RGB
 */
export function adjustTemperature(
  rgb: RGB, 
  kelvin: number, 
  referenceKelvin: number = 6500
): RGB {
  if (kelvin === referenceKelvin) return rgb;
  
  // Get the color of the target and reference temperatures
  const targetColor = kelvinToRgb(kelvin);
  const referenceColor = kelvinToRgb(referenceKelvin);
  
  // Calculate correction factors
  // We want to apply the inverse of the difference
  const correction = {
    r: referenceColor.r / targetColor.r,
    g: referenceColor.g / targetColor.g,
    b: referenceColor.b / targetColor.b,
  };
  
  // Normalize to keep brightness consistent
  const avgCorrection = (correction.r + correction.g + correction.b) / 3;
  
  return {
    r: clamp(rgb.r * (correction.r / avgCorrection), 0, 1),
    g: clamp(rgb.g * (correction.g / avgCorrection), 0, 1),
    b: clamp(rgb.b * (correction.b / avgCorrection), 0, 1),
  };
}

/**
 * Adjust tint (green-magenta axis)
 * 
 * Photography theory:
 * Tint adjusts the green-magenta balance, perpendicular to temperature.
 * - Negative: Add green (correct magenta casts, fluorescent light)
 * - Positive: Add magenta (correct green casts)
 * 
 * @param rgb - Input RGB (0-1)
 * @param amount - Tint amount (-100 to +100)
 * @returns Adjusted RGB
 */
export function adjustTint(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  // Convert to factor (negative = green, positive = magenta)
  const factor = amount / 100;
  
  // Adjust green channel inversely
  // Magenta = R + B, so reducing G adds magenta, increasing G adds green
  const greenAdjust = 1 - factor * 0.3;
  
  return {
    r: rgb.r,
    g: clamp(rgb.g * greenAdjust, 0, 1),
    b: rgb.b,
  };
}

// ============================================================================
// VIBRANCE & SATURATION
// ============================================================================

/**
 * Adjust saturation (linear multiplier)
 * 
 * Photography theory:
 * Saturation increases the intensity of all colors equally.
 * At -100, image becomes grayscale.
 * At +100, colors are doubled in intensity.
 * 
 * Potential issue: Already-saturated colors can clip/distort.
 * 
 * @param rgb - Input RGB (0-1)
 * @param amount - Saturation amount (-100 to +100)
 * @returns Adjusted RGB
 */
export function adjustSaturation(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  // Convert to HSL
  const hsl = rgbToHsl(rgb);
  
  // Adjust saturation
  const factor = 1 + amount / 100;
  hsl.s = clamp(hsl.s * factor, 0, 1);
  
  return hslToRgb(hsl);
}

/**
 * Adjust vibrance (intelligent saturation)
 * 
 * Photography theory:
 * Vibrance is like saturation, but smarter:
 * - Boosts less-saturated colors more than already-saturated ones
 * - Protects skin tones (orange/red hues at low saturation)
 * - Prevents oversaturation artifacts
 * 
 * This creates more natural-looking color enhancement than saturation.
 * 
 * @param rgb - Input RGB (0-1)
 * @param amount - Vibrance amount (-100 to +100)
 * @returns Adjusted RGB
 */
export function adjustVibrance(rgb: RGB, amount: number): RGB {
  if (amount === 0) return rgb;
  
  const hsl = rgbToHsl(rgb);
  
  // Factor based on current saturation
  // Less saturated colors get boosted more
  const saturationFactor = 1 - hsl.s;
  
  // Skin tone protection: reduce effect for skin-like hues (0-50° and 320-360°)
  let skinProtection = 1;
  if ((hsl.h >= 0 && hsl.h <= 50) || (hsl.h >= 320 && hsl.h <= 360)) {
    skinProtection = 0.5;
  }
  
  // Calculate adjustment with protection and saturation-awareness
  const adjustment = (amount / 100) * saturationFactor * skinProtection;
  
  hsl.s = clamp(hsl.s + adjustment * hsl.s, 0, 1);
  
  return hslToRgb(hsl);
}

// ============================================================================
// CLARITY (LOCAL CONTRAST)
// ============================================================================

/**
 * Calculate clarity adjustment for a pixel given its neighborhood
 * 
 * Photography theory:
 * Clarity enhances local contrast (microcontrast), making textures
 * and edges more pronounced. It's different from global contrast:
 * - Clarity affects texture and mid-frequency detail
 * - Contrast affects overall tonal separation
 * 
 * Implementation: We use a simplified unsharp mask approach where
 * we increase the difference between a pixel and its local average.
 * 
 * Note: Full clarity requires a blur pass, so this is the per-pixel
 * application phase. The blur must be pre-computed.
 * 
 * @param original - Original pixel RGB (0-1)
 * @param blurred - Blurred/averaged neighborhood RGB (0-1)
 * @param amount - Clarity amount (-100 to +100)
 * @returns Adjusted RGB
 */
export function applyClarity(original: RGB, blurred: RGB, amount: number): RGB {
  if (amount === 0) return original;
  
  const factor = amount / 100;
  
  // Calculate the detail (difference from local average)
  const detail = {
    r: original.r - blurred.r,
    g: original.g - blurred.g,
    b: original.b - blurred.b,
  };
  
  // Add boosted detail back
  // Positive clarity emphasizes detail, negative smooths it
  return {
    r: clamp(original.r + detail.r * factor, 0, 1),
    g: clamp(original.g + detail.g * factor, 0, 1),
    b: clamp(original.b + detail.b * factor, 0, 1),
  };
}

// ============================================================================
// SHARPENING (UNSHARP MASK)
// ============================================================================

/**
 * Apply unsharp mask sharpening
 * 
 * Photography theory:
 * Unsharp masking is the standard sharpening technique:
 * 1. Create a blurred copy of the image
 * 2. Subtract it from the original (creating an "unsharp mask")
 * 3. Add this difference back to the original
 * 
 * This enhances edges and fine detail.
 * 
 * Parameters:
 * - Amount: Strength of sharpening (0-150)
 * - Radius: Size of the blur kernel (affects edge width)
 * - Threshold: Minimum difference to sharpen (noise protection)
 * 
 * @param original - Original pixel RGB (0-1)
 * @param blurred - Blurred pixel RGB (0-1)
 * @param amount - Sharpening amount (0-150)
 * @param threshold - Threshold (0-255, converted internally)
 * @returns Sharpened RGB
 */
export function applyUnsharpMask(
  original: RGB, 
  blurred: RGB, 
  amount: number,
  threshold: number = 0
): RGB {
  if (amount === 0) return original;
  
  const factor = amount / 100;
  const thresholdNorm = threshold / 255;
  
  const sharpen = (orig: number, blur: number): number => {
    const diff = orig - blur;
    
    // Apply threshold - only sharpen if difference exceeds threshold
    if (Math.abs(diff) < thresholdNorm) {
      return orig;
    }
    
    return clamp(orig + diff * factor, 0, 1);
  };
  
  return {
    r: sharpen(original.r, blurred.r),
    g: sharpen(original.g, blurred.g),
    b: sharpen(original.b, blurred.b),
  };
}

// ============================================================================
// COMBINED ADJUSTMENT PIPELINE
// ============================================================================

/**
 * Apply all basic adjustments to a single pixel
 * 
 * Order matters! Standard adjustment order:
 * 1. White Balance (Temperature, Tint)
 * 2. Exposure
 * 3. Contrast
 * 4. Highlights/Shadows/Whites/Blacks
 * 5. Vibrance/Saturation
 * 
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @param basic - Basic adjustment settings
 * @param color - Color adjustment settings
 * @returns Adjusted RGB (0-255)
 */
export function applyBasicAdjustments(
  r: number,
  g: number,
  b: number,
  basic: BasicAdjustments,
  color: ColorAdjustments
): { r: number; g: number; b: number } {
  // Convert to normalized RGB
  let rgb = normalizeRgb(r, g, b);
  
  // 1. Color Temperature
  rgb = adjustTemperature(rgb, color.temperature);
  
  // 2. Tint
  rgb = adjustTint(rgb, color.tint);
  
  // 3. Exposure (using pre-computed LUT would be faster)
  const expMultiplier = Math.pow(2, basic.exposure);
  rgb = {
    r: clamp(rgb.r * expMultiplier, 0, 1),
    g: clamp(rgb.g * expMultiplier, 0, 1),
    b: clamp(rgb.b * expMultiplier, 0, 1),
  };
  
  // 4. Contrast
  const contrastFactor = (basic.contrast + 100) / 100;
  rgb = {
    r: clamp((rgb.r - 0.5) * contrastFactor + 0.5, 0, 1),
    g: clamp((rgb.g - 0.5) * contrastFactor + 0.5, 0, 1),
    b: clamp((rgb.b - 0.5) * contrastFactor + 0.5, 0, 1),
  };
  
  // 5. Tonal adjustments
  rgb = adjustHighlights(rgb, basic.highlights);
  rgb = adjustShadows(rgb, basic.shadows);
  rgb = adjustWhites(rgb, basic.whites);
  rgb = adjustBlacks(rgb, basic.blacks);
  
  // 6. Vibrance (before saturation)
  rgb = adjustVibrance(rgb, color.vibrance);
  
  // 7. Saturation
  rgb = adjustSaturation(rgb, color.saturation);
  
  return denormalizeRgb(rgb);
}

/**
 * Process entire ImageData with basic adjustments
 * 
 * @param imageData - Source ImageData
 * @param basic - Basic adjustments
 * @param color - Color adjustments
 * @returns New processed ImageData
 */
export function processImageData(
  imageData: ImageData,
  basic: BasicAdjustments,
  color: ColorAdjustments
): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const adjusted = applyBasicAdjustments(
      data[i],
      data[i + 1],
      data[i + 2],
      basic,
      color
    );
    
    outData[i] = adjusted.r;
    outData[i + 1] = adjusted.g;
    outData[i + 2] = adjusted.b;
    outData[i + 3] = data[i + 3]; // Preserve alpha
  }
  
  return output;
}

// ============================================================================
// FAST PATH PROCESSING (LUT-BASED)
// ============================================================================

/**
 * Apply pre-computed LUTs for faster processing
 * Used for exposure and contrast which don't need per-pixel context
 * 
 * @param imageData - Source ImageData
 * @param redLUT - Red channel LUT
 * @param greenLUT - Green channel LUT
 * @param blueLUT - Blue channel LUT
 * @returns New processed ImageData
 */
export function applyLUTs(
  imageData: ImageData,
  redLUT: Uint8Array,
  greenLUT: Uint8Array,
  blueLUT: Uint8Array
): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  for (let i = 0; i < data.length; i += 4) {
    outData[i] = redLUT[data[i]];
    outData[i + 1] = greenLUT[data[i + 1]];
    outData[i + 2] = blueLUT[data[i + 2]];
    outData[i + 3] = data[i + 3];
  }
  
  return output;
}
