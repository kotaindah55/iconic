import { IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import IconManager from './icon-manager';

/**
 * Manage icons for the properties.
 */
export default class PropertyIconManager extends IconManager {
	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.iconMap = plugin.settings.propertyIcons;

		// Rename the id as its corresponding property was renamed.
		this.plugin.registerEvent(this.app.metadataTypeManager.on(
			'rename', (oldKey, newKey) => {
				let iconBase = this.iconMap[oldKey];
				if (!iconBase) return;
				delete this.iconMap[oldKey];
				this.iconMap[newKey] = iconBase;
				this.plugin.requestSave();
			}
		));
	}

	/**
	 * Get icon item from corresponding id (property key).
	 * @param id Property key.
	 */
	public getIconItem(id: string): IconItem {
		let iconItem: IconItem = {
				id, category: 'property'
			},
			iconBase = this.iconMap[id];

		// Get and set default icon.
		let { types, registeredTypeWidgets } = this.app.metadataTypeManager,
			propType = types[id]?.type;
		
		if (propType) {
			iconItem.iconDefault = registeredTypeWidgets[propType].icon;
		} else {
			iconItem.iconDefault = 'file-question'
		}

		return Object.assign(iconItem, iconBase ?? {});
	}
}