/**
 * Darkens a color by a given factor
 * @param color - The color as a hex number (e.g., 0xff0000)
 * @param factor - The darkening factor (0-1, where 1 = no change, 0 = black)
 * @returns The darkened color as a hex number
 */
export function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/**
 * Gets the complementary color (opposite on color wheel)
 * @param color - The color as a hex number (e.g., 0xff0000)
 * @returns The complementary color as a hex number
 */
export function getComplementaryColor(color: number): number {
  // Extract RGB components
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  // Rotate hue by 180 degrees for complementary color
  h = (h + 0.5) % 1;

  // Convert HSL back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let rComp: number, gComp: number, bComp: number;

  if (s === 0) {
    rComp = gComp = bComp = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rComp = hue2rgb(p, q, h + 1 / 3);
    gComp = hue2rgb(p, q, h);
    bComp = hue2rgb(p, q, h - 1 / 3);
  }

  const rFinal = Math.round(rComp * 255);
  const gFinal = Math.round(gComp * 255);
  const bFinal = Math.round(bComp * 255);

  return (rFinal << 16) | (gFinal << 8) | bFinal;
}
