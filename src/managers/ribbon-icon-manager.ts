import { RibbonItem } from 'obsidian';
import { IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import IconManager from './icon-manager';

/**
 * Manage icons for the left ribbon items.
 */
export default class RibbonIconManager extends IconManager {
	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.iconMap = plugin.settings.ribbonIcons;
	}

	/**
	 * Add an icon to the corresponding ribbon item.
	 */
	public addIconRibbonItem(item: RibbonItem, icon: string, color?: string): void {
		this.addIcon(item.id, icon, color);
	}

	/**
	 * Change the icon of the corresponding ribbon item.
	 */
	public changeIconRibbonItem(item: RibbonItem, icon: string, color?: string): void {
		this.changeIcon(item.id, icon, color);
	}

	/**
	 * Delete the icon from the corresponding ribbon item.
	 */
	public deleteIconRibbonItem(item: RibbonItem): void {
		this.deleteIcon(item.id);
	}

	/**
	 * Get icon item from corresponding id (ribbon item id).
	 * @param id Ribbon item id.
	 */
	public getIconItem(id: string): IconItem {
		return Object.assign(
			{ id, category: 'ribbon' as const },
			this.iconMap[id] ?? {}
		);
	}
}