import { DragManager } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';
import { IconItem } from '../../model/icon-item';
import { getIconWithColor } from '../../utils/icon-utils';
import IconicPlugin from '../../main';

const dragManagerFactory = (plugin: IconicPlugin): ObjectFactory<DragManager> => ({
	onDragStart: oldFn => function (this: DragManager, evt, draggable) {
		oldFn.call(this, evt, draggable);

		let icon: string | undefined,
			color: string | undefined,
			iconItem: IconItem | undefined;

		if ('file' in draggable && draggable.file) {
			let { file } = draggable;
			iconItem = plugin.fileIconManager.getIconItem(file.path);
		} else if ('folder' in draggable && draggable.folder) {
			let { folder } = draggable;
			iconItem = plugin.fileIconManager.getIconItem(folder.path);
		} else if ('items' in draggable && draggable.items?.length === 1) {
			let bookmarkItem = draggable.items[0].item;
			iconItem = plugin.bookmarkIconManager.getIconItem(bookmarkItem.ctime.toString());
		}

		icon = iconItem?.icon ?? iconItem?.iconDefault;
		color = iconItem?.color;
		if (!icon) return;

		let iconSvg = getIconWithColor(icon, color);
		if (!iconSvg) return;
		
		this.ghostEl
			?.querySelector('.drag-ghost-self svg')
			?.replaceWith(iconSvg);
	}
})

export function patchDragManager(plugin: IconicPlugin) {
	let dragManagerProto = Object.getPrototypeOf(plugin.app.dragManager) as DragManager;
	return around(dragManagerProto, dragManagerFactory(plugin));
}