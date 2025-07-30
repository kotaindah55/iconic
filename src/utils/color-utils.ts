import { RGB } from 'obsidian';
import { DEFAULT_COLORS, CSS_COLORS, RGB_FALLBACK } from '../constants/colors';

const COLOR_MIX_RE = /color-mix\(in srgb, rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)(?: (\d+)%)?, rgba?\((\d+), (\d+), ([\d.]+)(?:, ([\d.]+))?\)(?: ([\d.]+)%)?\)/;
const CONVERT_EL = createDiv();

/**
 * Convert color into rgb/rgba() string.
 * @param color a color name, or a specific CSS color
 */
export function toRgb(color: string | null | undefined): string {
	let cssVar = '--icon-color',
		cssColor = RGB_FALLBACK;

	if (!color) {
		cssColor = getComputedStyle(document.body).getPropertyValue(cssVar);
	} else if (DEFAULT_COLORS.has(color)) {
		cssVar = DEFAULT_COLORS.get(color) ?? cssVar;
		cssColor = window.getComputedStyle(document.body).getPropertyValue(cssVar);
	} else if (CSS_COLORS.has(color)) {
		cssColor = CSS_COLORS.get(color) ?? cssColor;
	} else if (CSS.supports('color', color)) {
		cssColor = color;
	} else {
		return RGB_FALLBACK;
	}

	// Color properties are converted into rgb/rgba()
	CONVERT_EL.style.color = cssColor;
	let rgbValue = CONVERT_EL.style.color;

	// Value might still be wrapped in color-mix()
	if (rgbValue.startsWith('color-mix')) {
		return mixToRgb(rgbValue);
	} else if (rgbValue.startsWith('rgb')) {
		return rgbValue;
	} else {
		return RGB_FALLBACK;
	}
}

/**
 * Convert color into RGB object.
 * @param color a color name, or a specific CSS color
 */
export function toRgbObject(color: string | null | undefined): RGB {
	let [r, g, b] = toRgb(color)
		.replaceAll(/[^\d.,]/g, '')
		.split(',')
		.map(Number);
	return { r, g, b };
}

/**
 * Convert color into HSL array.
 * @param color a color name, or a specific CSS color
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB}
 */
export function toHslArray(color: string | null | undefined): [h: number, s: number, l: number] {
	let [r, g, b] = toRgb(color)
		.replaceAll(/[^\d.,]/g, '')
		.split(',')
		.map(Number);

	r = Math.max(Math.min(r, 255), 0) / 255;
	g = Math.max(Math.min(g, 255), 0) / 255;
	b = Math.max(Math.min(b, 255), 0) / 255;

	let max = Math.max(r, g, b),
		min = Math.min(r, g, b),
		chroma = max - min,
		l = (max + min) / 2,
		s = Number.isInteger(l) ? 0 : (max - l) / Math.min(l, 1 - l),
		h = 0;

	if (chroma > 0) switch (max) {
		case r: h = (g - b) / chroma % 6; break;
		case g: h = (b - r) / chroma + 2; break;
		case b: h = (r - g) / chroma + 4; break;
	}

	return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert color into RGB HEX string.
 * @param color a color name, or a specific CSS color
 */
export function toRgbHex(color: string | null | undefined): string {
	let { r, g, b } = toRgbObject(color);

	// Convert into HEX number.
	let rHex = Math.round(r).toString(16),
		gHex = Math.round(g).toString(16),
		bHex = Math.round(b).toString(16);
	
	if (rHex.length === 1) rHex = '0' + rHex;
	if (gHex.length === 1) gHex = '0' + gHex;
	if (bHex.length === 1) bHex = '0' + bHex;

	return `#${rHex}${gHex}${bHex}`;
}

/**
 * Set an inline color filter on an element.
 * @param color If null, it removes the filter.
 */
export function colorFilter(el: HTMLElement, color: string | null): void {
	if (color === null) {
		el.style.removeProperty('filter');
		return;
	}

	let [h, s] = toHslArray(color);
	el.setCssStyles({
		filter: `grayscale() sepia() hue-rotate(${h - 50}deg) saturate(${s * 5}%)`
	});
}

/**
 * Convert color-mix() string into rgb/rgba() string.
 * @param color a color-mix() string with rgb/rgba() components
 */
function mixToRgb(colorMix: string): string {
	let matches = colorMix.match(COLOR_MIX_RE);
	if (!matches) return 'rgb(0, 0, 0)';

	let [, r1, g1, b1, a1, p1, r2, g2, b2, a2, p2] = matches.map(Number);

	// Normalize any missing percentages
	p1 = isNaN(p1) ? (isNaN(p2) ? 50 : 100 - p2) : p1;
	p2 = isNaN(p2) ? 100 - p1 : p2;

	// Scale percentages if they don't total 100
	let total = p1 + p2;
	if (total !== 100) {
		p1 = (p1 / total) * 100;
		p2 = (p2 / total) * 100;
	}

	// Mix RGB components
	let r = Math.round((r1 * p1 + r2 * p2) / 100),
		g = Math.round((g1 * p1 + g2 * p2) / 100),
		b = Math.round((b1 * p1 + b2 * p2) / 100);

	// Mix alpha components
	a1 = isNaN(a1) ? 1 : a1;
	a2 = isNaN(a2) ? 1 : a2;
	let a = (a1 * p1 + a2 * p2) / 100;

	return a !== 1
		? `rgba(${r}, ${g}, ${b}, ${a})`
		: `rgb(${r}, ${g}, ${b})`;
}