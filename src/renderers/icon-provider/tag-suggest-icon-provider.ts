import { TagSuggest, TagSuggestResult } from 'obsidian';
import { setIconWithColor } from '../../utils/icon-utils';
import IconicPlugin from '../../main';
import TagIconManager from '../../managers/tag-icon-manager';

/**
 * Provide utility to insert icons to the tag suggestion results.
 */
export default class TagSuggestIconProvider {
	public readonly plugin: IconicPlugin;

	private readonly iconManager: TagIconManager;
	private readonly suggest: TagSuggest;

	constructor(plugin: IconicPlugin, suggest: TagSuggest) {
		this.plugin = plugin;
		this.iconManager = plugin.tagIconManager;
		this.suggest = suggest;
	}

	/**
	 * Prepend icon element to the {@link resultEl | result element}.
	 */
	public prependIcon(
		suggestion: TagSuggestResult | null,
		resultEl: HTMLElement
	): void {
		// Create icon element.
		let contentEl = createDiv('suggestion-content'),
			titleEl = contentEl.createDiv('suggestion-title'),
			suggestIconEl = createDiv('suggestion-icon'),
			iconEl = suggestIconEl.createDiv('iconic-icon suggestion-flair');

		titleEl.append(...resultEl.childNodes);
		resultEl.append(suggestIconEl, contentEl);
		resultEl.addClass('mod-complex');

		if (!suggestion) return;

		// Check available icon item.
		let iconItem = this.iconManager.getIconItem('#' + suggestion.tag);
		if (!iconItem) return;

		// Check existing icon.
		let icon = iconItem.icon ?? iconItem.iconDefault;
		if (!icon) return;

		setIconWithColor(iconEl, icon, iconItem.color);
	}
}