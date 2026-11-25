/** WCAG 2.x relative luminance and contrast ratio for #RRGGBB colors. Dependency-free. */
const HEX = /^#[0-9a-f]{6}$/i;

export const MINIMUM_RATIO = Object.freeze({ text: 4.5, ui: 3 });

export function relativeLuminance(hex) {
  if (!HEX.test(hex)) throw new TypeError(`Expected #RRGGBB, received ${hex}`);
  const [r, g, b] = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}
