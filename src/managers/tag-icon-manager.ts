import { IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import IconManager from './icon-manager';

/**
 * Manage icons for the tags.
 */
export default class TagIconManager extends IconManager {
	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.iconMap = plugin.settings.tagIcons;
	}

	/**
	 * Get icon item from corresponding id (tag name).
	 * @param id Tag name prefixed with hash (`#`).
	 */
	public getIconItem(id: string): IconItem {
		let iconItem: IconItem = {
			id, category: 'tag'
		};
		return Object.assign(iconItem, this.iconMap[id] ?? {});
	}
}