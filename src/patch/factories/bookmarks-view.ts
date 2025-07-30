import { App, BookmarkGroupTreeItem, BookmarkItemGroup, BookmarksView } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';
import { mockLeaf } from '../mock/mock-utils';
import { BookmarksPluginInstance } from '../mock/classes';

const bookmarksViewFactory: ObjectFactory<BookmarksView> = {
	createNewGroup: () => function (this: BookmarksView, parent) {
		let newGroup: BookmarkItemGroup = {
			type: 'group',
			ctime: Date.now(),
			items: [],
			title: i18next.t('plugins.bookmarks.label-untitled-group')
		};

		if (parent) parent.items.push(newGroup);
		else this.plugin.items.push(newGroup);

		this.plugin.saveData();
		this.update();
		this.getItemDom(newGroup).startRename();
		this.plugin.trigger('add', newGroup);
	}
}

const bookmarkGroupTreeItemFactory: ObjectFactory<BookmarkGroupTreeItem> = {
	updateCollapsed: oldFn => async function (this: BookmarkGroupTreeItem, animate) {
		await oldFn.call(this, animate);

		if (!this.view.iconRenderer) return;

		let { iconRenderer } = this.view,
			{ iconEl } = this,
			{ plugin } = iconRenderer,
			id = this.item.ctime.toString(),
			hasIcon = !!iconRenderer.iconManager.iconMap[id];

		if (iconEl?.isShown() && !hasIcon) plugin.setIcon(iconEl, {
			id, category: 'bookmark', icon: this.collapsed ? 'folder-closed' : 'folder-open'
		});
	}
}

export function patchBookmarksView(app: App) {
	let patchContracts: (() => unknown)[] = [];

	let creator = app.internalPlugins.getPluginById('bookmarks').views.bookmarks,
		view = creator(mockLeaf()),
		viewProto = Object.getPrototypeOf(view) as BookmarksView;
	
	(view.plugin as unknown) = new BookmarksPluginInstance();
	view.update();

	let groupTreeItem = view.root?.vChildren.children[0] as BookmarkGroupTreeItem,
		groupTreeItemProto = Object.getPrototypeOf(groupTreeItem) as BookmarkGroupTreeItem;
	
	patchContracts.push(around(viewProto, bookmarksViewFactory));
	patchContracts.push(around(groupTreeItemProto, bookmarkGroupTreeItemFactory));

	return () => patchContracts.forEach(uninstaller => uninstaller());
}