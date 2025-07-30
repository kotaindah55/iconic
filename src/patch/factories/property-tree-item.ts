import { PropertyTreeItem } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';
import { mockLeaf } from '../mock/mock-utils';
import IconicPlugin from '../../main';

const propertyTreeItemFactory = (plugin: IconicPlugin): ObjectFactory<PropertyTreeItem> => ({
	setProperty: () => function (this: PropertyTreeItem, info) {
		let iconManager = plugin.propertyIconManager,
			id = info.name,
			iconItem = iconManager.getIconItem(id),
			icon = iconItem.icon ?? iconItem.iconDefault!,
			{ color, category } = iconItem;
		
		plugin.setIcon(this.iconEl, { id, category, icon, color }, { reuse: true });
		this.property = {
			key: id,
			type: info.type,
			value: ''
		};
		this.count = info.count;
		this.updateTitle();
		this.flairEl.setText(this.count.toString());
		this.iconEl.addClass('iconic-icon');

		return this;
	}
})

export function patchPropertyTreeItem(plugin: IconicPlugin) {
	let propertiesPlugin = plugin.app.internalPlugins.getPluginById('properties'),
		view = propertiesPlugin.views['all-properties'](mockLeaf());

	view.load();
	let propTreeItemProto = Object.getPrototypeOf(view.doms['test']) as PropertyTreeItem;
	
	return around(propTreeItemProto, propertyTreeItemFactory(plugin));
}