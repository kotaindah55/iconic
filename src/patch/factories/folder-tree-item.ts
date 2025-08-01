import { App, FolderTreeItem } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';
import { mockLeaf } from '../mock/mock-utils';

const folderTreeItemFactory: ObjectFactory<FolderTreeItem> = {
	updateCollapsed: oldFn => async function (this: FolderTreeItem, animate) {
		await oldFn.call(this, animate);

		if (!this.view.iconRenderer) return;

		let { iconRenderer } = this.view,
			{ iconEl } = this,
			{ plugin } = iconRenderer,
			{ showAllFolderIcons } = plugin.settings,
			id = this.file.path,
			hasIcon = !!iconRenderer.iconManager.iconMap[id];

		if (showAllFolderIcons && !hasIcon && iconEl) {
			let icon = `lucide-folder-${this.collapsed ? 'closed' : 'open'}`,
				category = 'folder' as const;
			plugin.setIcon(iconEl, { id, category, icon });
		} else {
			iconEl?.empty();
			iconEl?.hide();
		}
	}
}

export function patchFolderTreeItem(app: App) {
	let creator = app.internalPlugins.getPluginById('file-explorer').views['file-explorer'],
		view = creator(mockLeaf());

	view.load();
	let folderTreeItemProto = Object.getPrototypeOf(view.fileItems['fakeFolder']) as FolderTreeItem;
	view.unload();
	
	return around(folderTreeItemProto, folderTreeItemFactory);
}