import { getIcon } from 'obsidian';
import { ICON_HEADER_ATTRS } from '../constants/icon-header';
import { colorFilter, toValidColor } from './color-utils';
import { IconBase } from '../model/icon-item';
import LUCIDE_ICONS_EXTRA, { IconNodeData } from '../../data/lucide-icons-extra.mjs';
import EMOJI_SHORTNAMES from '../../data/emoji-shortnames.mjs';

/**
 * Convert JSON-formatted icon nodes info to an SVG element.
 * @param iconName Usually an icon id, used as a CSS class.
 * @param nodes Icon nodes info.
 */
function nodesToSVG(iconName: string, nodes: IconNodeData[]): SVGSVGElement {
	return createSvg('svg', {
		cls: ['svg-icon', iconName],
		attr: ICON_HEADER_ATTRS,
	}, iconSVG => nodes.forEach(node => {
		iconSVG.createSvg(node[0], { attr: node[1] });
	}));
}

/**
 * Create an svg from one of {@link LUCIDE_ICONS_EXTRA} ids.
 * @param iconName Icon id from {@link LUCIDE_ICONS_EXTRA}.
 */
function getExtraIcon(iconName: string): SVGSVGElement | null {
	let iconProps = LUCIDE_ICONS_EXTRA[iconName];
	if (!iconProps) return null;
	else return nodesToSVG(iconName, iconProps.nodes);
}

/**
 * Similiar to Obsidian's `setIcon()`, but with ability to set the color
 * of the icon, use the extra icons or emojis.
 * 
 * @param parent Element that the icon will be inserted to.
 * @param iconName Icon id.
 * @param color Can be a CSS named color or CSS color value.
 * 
 * @returns Inserted icon svg if any.
 */
export function setIconWithColor(
	parent: HTMLElement,
	iconName: string,
	color: string | null = null
): SVGSVGElement | HTMLElement | null {
	parent.empty();

	if (iconName in EMOJI_SHORTNAMES) return setEmoji(
		parent, iconName, color
	);

	let iconSVG = getIcon(iconName) ?? getExtraIcon(iconName);
	if (iconSVG) {
		let validColor = toValidColor(color);
		iconSVG.setAttr('stroke', validColor);
		iconSVG.setAttr('data-iconic-color', color);
		parent.append(iconSVG);
	}
	return iconSVG;
}

/**
 * Similiar to Obsidian's `getIcon()`, but with ability to set the color
 * of the icon and use the extra icons or emojis.
 * 
 * @param iconName Icon id.
 * @param color Can be a CSS named color or CSS color value.
 */
export function getIconWithColor(
	iconName: string,
	color: string | null = null
): SVGSVGElement | HTMLElement | null {
	let iconSVG = getIcon(iconName) ?? getExtraIcon(iconName);

	if (iconName in EMOJI_SHORTNAMES) return getEmoji(
		iconName, color
	);

	if (iconSVG) {
		let validColor = toValidColor(color);
		iconSVG.setAttr('stroke', validColor);
		iconSVG.setAttr('data-iconic-color', color);
		return iconSVG;
	}
	return null;
}

/**
 * Insert an emoji element to the {@link parent | parent element}.
 * 
 * @param parent Element that the icon will be inserted to.
 * @param emoji Any of emoji unicodes.
 * @param color Can be a CSS named color or CSS color value.
 * 
 * @returns Inserted emoji element.
 */
export function setEmoji(
	parent: HTMLElement,
	emoji: string,
	color: string | null = null
): HTMLElement {
	let emojiEl = getEmoji(emoji, color);
	parent.empty();
	parent.prepend(emojiEl);
	return emojiEl;
}

/**
 * Get an emoji element.
 * 
 * @param parent Element that the icon will be inserted to.
 * @param emoji Any of emoji unicodes.
 * @param color Can be a CSS named color or CSS color value.
 */
export function getEmoji(
	emoji: string,
	color: string | null = null
): HTMLElement {
	let emojiEl = createDiv({
		cls: 'iconic-emoji',
		text: emoji,
		attr: {
			'data-iconic-emoji': emoji,
			'data-iconic-color': color
		}
	});
	colorFilter(emojiEl, color);
	return emojiEl;
}

/**
 * Compare equality between the icon element and the icon base.
 * 
 * @param iconSVGOrEmoji Icon SVG or emoji inner element.
 * @param iconBase Icon base object
 */
export function isEq(
	iconSVGOrEmoji: SVGSVGElement | HTMLElement,
	iconBase: IconBase
): boolean {
	let { icon, color } = iconBase,
		isEmoji = iconSVGOrEmoji.hasClass('iconic-emoji'),
		sameColor = iconSVGOrEmoji.getAttr('data-iconic-color') == color,
		sameIcon = isEmoji
			? iconSVGOrEmoji.getAttr('data-iconic-emoji') === icon
			: iconSVGOrEmoji.hasClass(icon);

	return sameColor && sameIcon;
}