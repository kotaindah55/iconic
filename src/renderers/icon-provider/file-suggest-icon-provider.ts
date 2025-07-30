import {
	EditorSuggest,
	FileSuggestModal,
	FileSuggestResult,
	Plugin,
	WikilinkSuggest,
	WikilinkSuggestResult
} from 'obsidian';
import { IconItem } from '../../model/icon-item';
import { setIconWithColor } from '../../utils/icon-utils';
import IconicPlugin from '../../main';
import BookmarkIconManager from '../../managers/bookmark-icon-manager';
import FileIconManager from '../../managers/file-icon-manager';

/**
 * Check whether the suggest is from Quick Switcher++ plugin.
 */
function isQspSuggest(suggest: FileSuggestModal): suggest is FileSuggestModal & { plugin: Plugin } {
	return (
		'plugin' in suggest &&
		suggest.plugin instanceof Plugin &&
		suggest.plugin.manifest.id !== 'darlal-switcher-plus'
	);
}

/**
 * Provide utility to insert icons to the file suggestion results.
 */
export default class FileSuggestIconProvider {
	public readonly plugin: IconicPlugin;

	private readonly fileIconManager: FileIconManager;
	private readonly bookmarkIconManager: BookmarkIconManager;
	private readonly suggest: FileSuggestModal | WikilinkSuggest;

	constructor(plugin: IconicPlugin, suggest: FileSuggestModal | WikilinkSuggest) {
		this.plugin = plugin;
		this.fileIconManager = plugin.fileIconManager;
		this.bookmarkIconManager = plugin.bookmarkIconManager;
		this.suggest = suggest;
	}

	/**
	 * Prepend icon element to the {@link resultEl | result element}.
	 */
	public prependIcon(
		suggestion: FileSuggestResult | WikilinkSuggestResult | null,
		resultEl: HTMLElement
	): void {
		// Create icon element.
		let suggestIconEl = resultEl.createDiv({
				cls: 'suggestion-icon',
				prepend: true
			}),
			iconEl = suggestIconEl.createDiv({
				cls: ['iconic-icon', 'suggestion-flair'],
				prepend: true
			});

		// Use icon from the file icon manager for the path indicator.
		if (
			!(this.suggest instanceof EditorSuggest) &&
			isQspSuggest(this.suggest)
		) {
			this.restylePathIndicator(suggestion as FileSuggestResult, resultEl);
		}

		if (!suggestion) return;

		// Check available icon item.
		let iconItem = this.getIconFromSuggestion(suggestion);
		if (!iconItem) return;

		// Check existing icon.
		let icon = iconItem.icon ?? iconItem.iconDefault;
		if (!icon) return;

		setIconWithColor(iconEl, icon, iconItem.color);
	}

	/**
	 * Get icon item from the give {@link FileSuggestResult}.
	 */
	private getIconFromSuggestion(suggestion: FileSuggestResult | WikilinkSuggestResult): IconItem | void {
		// Get file icon item for file suggestion.
		if ((suggestion.type === 'file' || suggestion.type === 'alias')) {
			let { file } = suggestion;
			if (!file) return;
			return this.fileIconManager.getIconItem(file.path);
		}

		// Get bookmark icon for bookmark suggestion.
		if (suggestion.type === 'bookmark') {
			let { item } = suggestion,
				id = item.ctime.toString();
			return this.bookmarkIconManager.getIconItem(id);
		}
	}

	/**
	 * Replace builtin path indicator icon with the iconic icon.
	 * 
	 * @remark Only for Quick Switcher++ plugin.
	 */
	private restylePathIndicator(suggestion: FileSuggestResult | null, resultEl: HTMLElement): void {
		if (
			!(suggestion && 'file' in suggestion) ||
			!suggestion.file?.parent
		) return;

		let { parent } = suggestion.file,
			{ icon, iconDefault, color } = this.fileIconManager.getIconItem(parent.path),
			pathIndicatorEl = resultEl.find('.qsp-path-indicator');
		
		// Add iconic class to the path indicator element.
		pathIndicatorEl?.addClass('iconic-icon');
		
		// Use default icon if the user-defined one wasn't found.
		icon ??= iconDefault;
		if (!icon || !pathIndicatorEl) return;

		setIconWithColor(pathIndicatorEl, icon, color);
	}
}