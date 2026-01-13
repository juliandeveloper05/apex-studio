/**
 * APEX Photo Studio - Color Space Utilities
 * 
 * Precise color space conversions for professional image processing.
 * Implements industry-standard algorithms for:
 * - RGB ↔ HSL (Hue, Saturation, Lightness)
 * - RGB ↔ LAB (CIELAB perceptual color space)
 * - RGB ↔ XYZ (CIE 1931 intermediate)
 * - Kelvin to RGB (color temperature)
 * - Gamma correction (sRGB)
 * 
 * All RGB values are normalized 0-1 unless otherwise noted.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface HSL {
  h: number; // 0-360 degrees
  s: number; // 0-1
  l: number; // 0-1
}

export interface HSV {
  h: number; // 0-360 degrees
  s: number; // 0-1
  v: number; // 0-1
}

export interface LAB {
  l: number; // 0-100
  a: number; // typically -128 to +128
  b: number; // typically -128 to +128
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// D65 illuminant reference white point
const D65_X = 0.95047;
const D65_Y = 1.0;
const D65_Z = 1.08883;

// LAB constants
const LAB_EPSILON = 0.008856; // (6/29)^3
const LAB_KAPPA = 903.3;      // (29/3)^3

// ============================================================================
// GAMMA CORRECTION (sRGB)
// ============================================================================

/**
 * Apply sRGB gamma encoding (linear to gamma)
 * Used when preparing linear values for display
 * 
 * @param linear - Linear RGB value (0-1)
 * @returns Gamma-encoded value (0-1)
 */
export function applyGamma(linear: number): number {
  if (linear <= 0.0031308) {
    return 12.92 * linear;
  }
  return 1.055 * Math.pow(linear, 1.0 / 2.4) - 0.055;
}

/**
 * Remove sRGB gamma encoding (gamma to linear)
 * Used when preparing display values for processing
 * 
 * @param gamma - Gamma-encoded value (0-1)
 * @returns Linear RGB value (0-1)
 */
export function removeGamma(gamma: number): number {
  if (gamma <= 0.04045) {
    return gamma / 12.92;
  }
  return Math.pow((gamma + 0.055) / 1.055, 2.4);
}

/**
 * Apply gamma to RGB triplet
 */
export function applyGammaRGB(rgb: RGB): RGB {
  return {
    r: applyGamma(rgb.r),
    g: applyGamma(rgb.g),
    b: applyGamma(rgb.b),
  };
}

/**
 * Remove gamma from RGB triplet
 */
export function removeGammaRGB(rgb: RGB): RGB {
  return {
    r: removeGamma(rgb.r),
    g: removeGamma(rgb.g),
    b: removeGamma(rgb.b),
  };
}

// ============================================================================
// RGB ↔ HSL CONVERSION
// ============================================================================

/**
 * Convert RGB to HSL (Hue, Saturation, Lightness)
 * Standard algorithm used in most photo editors
 * 
 * Theory: HSL separates color into perceptually meaningful components:
 * - Hue: The base color (0-360°, red=0, green=120, blue=240)
 * - Saturation: Color intensity (0=gray, 1=pure color)
 * - Lightness: Brightness (0=black, 0.5=pure color, 1=white)
 * 
 * @param rgb - RGB values (0-1 each)
 * @returns HSL values
 */
export function rgbToHsl(rgb: RGB): HSL {
  const { r, g, b } = rgb;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // Lightness is the average of max and min
  const l = (max + min) / 2;
  
  // Achromatic (gray) case
  if (delta === 0) {
    return { h: 0, s: 0, l };
  }
  
  // Saturation depends on lightness
  // Higher saturation possible at mid-lightness
  const s = l > 0.5 
    ? delta / (2 - max - min)
    : delta / (max + min);
  
  // Hue calculation based on which channel is max
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / delta) % 6;
      break;
    case g:
      h = (b - r) / delta + 2;
      break;
    case b:
    default:
      h = (r - g) / delta + 4;
      break;
  }
  
  h *= 60;
  if (h < 0) h += 360;
  
  return { h, s, l };
}

/**
 * Convert HSL to RGB
 * Inverse of rgbToHsl
 * 
 * @param hsl - HSL values
 * @returns RGB values (0-1 each)
 */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  
  // Achromatic case
  if (s === 0) {
    return { r: l, g: l, b: l };
  }
  
  const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: r + m,
    g: g + m,
    b: b + m,
  };
}

// ============================================================================
// RGB ↔ HSV CONVERSION
// ============================================================================

/**
 * Convert RGB to HSV (Hue, Saturation, Value)
 * Similar to HSL but Value represents the maximum RGB component
 * 
 * @param rgb - RGB values (0-1 each)
 * @returns HSV values
 */
export function rgbToHsv(rgb: RGB): HSV {
  const { r, g, b } = rgb;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  
  if (delta === 0) {
    return { h: 0, s: 0, v };
  }
  
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / delta) % 6;
      break;
    case g:
      h = (b - r) / delta + 2;
      break;
    case b:
    default:
      h = (r - g) / delta + 4;
      break;
  }
  
  h *= 60;
  if (h < 0) h += 360;
  
  return { h, s, v };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const { h, s, v } = hsv;
  
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: r + m,
    g: g + m,
    b: b + m,
  };
}

// ============================================================================
// RGB ↔ XYZ ↔ LAB CONVERSION
// ============================================================================

/**
 * Convert RGB to CIE XYZ color space
 * XYZ is a device-independent color space used as intermediate
 * for LAB conversion
 * 
 * Uses sRGB to XYZ matrix with D65 illuminant
 * 
 * @param rgb - RGB values (0-1 each, linear/gamma-corrected)
 * @returns XYZ values
 */
export function rgbToXyz(rgb: RGB): XYZ {
  // First remove gamma (convert to linear RGB)
  const linear = removeGammaRGB(rgb);
  
  // sRGB to XYZ matrix (D65 illuminant)
  // These values come from the sRGB specification
  return {
    x: linear.r * 0.4124564 + linear.g * 0.3575761 + linear.b * 0.1804375,
    y: linear.r * 0.2126729 + linear.g * 0.7151522 + linear.b * 0.0721750,
    z: linear.r * 0.0193339 + linear.g * 0.1191920 + linear.b * 0.9503041,
  };
}

/**
 * Convert CIE XYZ to RGB
 * Inverse of rgbToXyz
 * 
 * @param xyz - XYZ values
 * @returns RGB values (0-1 each)
 */
export function xyzToRgb(xyz: XYZ): RGB {
  // XYZ to linear RGB matrix (inverse of above)
  const linear: RGB = {
    r: xyz.x *  3.2404542 + xyz.y * -1.5371385 + xyz.z * -0.4985314,
    g: xyz.x * -0.9692660 + xyz.y *  1.8760108 + xyz.z *  0.0415560,
    b: xyz.x *  0.0556434 + xyz.y * -0.2040259 + xyz.z *  1.0572252,
  };
  
  // Apply gamma and clamp
  return {
    r: Math.max(0, Math.min(1, applyGamma(linear.r))),
    g: Math.max(0, Math.min(1, applyGamma(linear.g))),
    b: Math.max(0, Math.min(1, applyGamma(linear.b))),
  };
}

/**
 * Convert CIE XYZ to CIELAB
 * 
 * LAB is a perceptually uniform color space where:
 * - L: Lightness (0=black, 100=white)
 * - a: Green-Red axis
 * - b: Blue-Yellow axis
 * 
 * Equal distances in LAB correspond to equal perceived color differences.
 * This makes it ideal for color adjustments.
 * 
 * @param xyz - XYZ values
 * @returns LAB values
 */
export function xyzToLab(xyz: XYZ): LAB {
  // Normalize by D65 white point
  let x = xyz.x / D65_X;
  let y = xyz.y / D65_Y;
  let z = xyz.z / D65_Z;
  
  // Apply the LAB transfer function
  const f = (t: number) => {
    if (t > LAB_EPSILON) {
      return Math.pow(t, 1/3);
    }
    return (LAB_KAPPA * t + 16) / 116;
  };
  
  x = f(x);
  y = f(y);
  z = f(z);
  
  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

/**
 * Convert CIELAB to CIE XYZ
 * Inverse of xyzToLab
 * 
 * @param lab - LAB values
 * @returns XYZ values
 */
export function labToXyz(lab: LAB): XYZ {
  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  
  const f_inv = (t: number) => {
    const t3 = t * t * t;
    if (t3 > LAB_EPSILON) {
      return t3;
    }
    return (116 * t - 16) / LAB_KAPPA;
  };
  
  return {
    x: D65_X * f_inv(fx),
    y: D65_Y * f_inv(fy),
    z: D65_Z * f_inv(fz),
  };
}

/**
 * Convert RGB directly to CIELAB
 * Convenience function combining rgbToXyz and xyzToLab
 * 
 * @param rgb - RGB values (0-1 each)
 * @returns LAB values
 */
export function rgbToLab(rgb: RGB): LAB {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Convert CIELAB directly to RGB
 * Convenience function combining labToXyz and xyzToRgb
 * 
 * @param lab - LAB values
 * @returns RGB values (0-1 each)
 */
export function labToRgb(lab: LAB): RGB {
  return xyzToRgb(labToXyz(lab));
}

// ============================================================================
// COLOR TEMPERATURE (KELVIN)
// ============================================================================

/**
 * Convert color temperature (Kelvin) to RGB multipliers
 * 
 * This algorithm approximates the color of a black-body radiator
 * at a given temperature. It's used to:
 * 1. Apply white balance corrections
 * 2. Simulate warming/cooling filters
 * 
 * Based on Tanner Helland's approximation algorithm, which fits
 * polynomial curves to the Planckian locus.
 * 
 * @param kelvin - Color temperature (1000-40000K typical)
 * @returns RGB multipliers (typically 0-1.5 range)
 */
export function kelvinToRgb(kelvin: number): RGB {
  // Clamp to reasonable range
  kelvin = Math.max(1000, Math.min(40000, kelvin));
  
  // Scale kelvin to 0-66 range for calculation
  const temp = kelvin / 100;
  
  let r: number, g: number, b: number;
  
  // Red channel
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }
  
  // Green channel
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }
  
  // Blue channel
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }
  
  // Normalize to 0-1
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}

/**
 * Calculate temperature adjustment multipliers
 * 
 * Given current and target temperatures, calculate the multipliers
 * needed to shift the color temperature.
 * 
 * @param current - Current color temperature in Kelvin
 * @param target - Target color temperature in Kelvin
 * @returns RGB multipliers to apply
 */
export function getTemperatureShift(current: number, target: number): RGB {
  const currentRgb = kelvinToRgb(current);
  const targetRgb = kelvinToRgb(target);
  
  // Calculate ratio needed to shift from current to target
  return {
    r: targetRgb.r / currentRgb.r,
    g: targetRgb.g / currentRgb.g,
    b: targetRgb.b / currentRgb.b,
  };
}

// ============================================================================
// LUMINANCE AND CONTRAST
// ============================================================================

/**
 * Calculate relative luminance (Y component of XYZ)
 * 
 * This follows the ITU-R BT.709 standard used in sRGB.
 * Human vision is most sensitive to green, less to red, least to blue.
 * 
 * @param rgb - RGB values (0-1 each)
 * @returns Luminance value (0-1)
 */
export function getLuminance(rgb: RGB): number {
  // First linearize the RGB values
  const linear = removeGammaRGB(rgb);
  
  // BT.709 luminance coefficients
  return 0.2126 * linear.r + 0.7152 * linear.g + 0.0722 * linear.b;
}

/**
 * Calculate perceived brightness (faster approximation)
 * 
 * This is a simpler formula that doesn't require gamma correction
 * but is less accurate. Good for quick calculations.
 * 
 * @param rgb - RGB values (0-1 each)
 * @returns Perceived brightness (0-1)
 */
export function getPerceivedBrightness(rgb: RGB): number {
  // Faster approximation using squared values
  return Math.sqrt(
    0.299 * rgb.r * rgb.r +
    0.587 * rgb.g * rgb.g +
    0.114 * rgb.b * rgb.b
  );
}

// ============================================================================
// COLOR DISTANCE
// ============================================================================

/**
 * Calculate Delta E (CIE76) color difference
 * 
 * Delta E is the standard measure of perceptual color difference.
 * - < 1: Not perceptible by human eye
 * - 1-2: Perceptible through close observation
 * - 2-10: Noticeable at a glance
 * - 11-49: Colors are more similar than opposite
 * - 100: Exact opposite colors
 * 
 * @param lab1 - First LAB color
 * @param lab2 - Second LAB color
 * @returns Delta E value
 */
export function deltaE(lab1: LAB, lab2: LAB): number {
  const dL = lab1.l - lab2.l;
  const dA = lab1.a - lab2.a;
  const dB = lab1.b - lab2.b;
  
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two RGB colors
 */
export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

/**
 * Convert 0-255 RGB to normalized 0-1 RGB
 */
export function normalizeRgb(r: number, g: number, b: number): RGB {
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}

/**
 * Convert normalized 0-1 RGB to 0-255 RGB
 */
export function denormalizeRgb(rgb: RGB): { r: number; g: number; b: number } {
  return {
    r: Math.round(clamp(rgb.r * 255, 0, 255)),
    g: Math.round(clamp(rgb.g * 255, 0, 255)),
    b: Math.round(clamp(rgb.b * 255, 0, 255)),
  };
}
