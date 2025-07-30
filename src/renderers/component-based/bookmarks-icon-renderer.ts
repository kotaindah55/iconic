import { BookmarksView, setIcon, WebviewerPluginInstance } from 'obsidian';
import { iterateTreeNode } from '../../@external/obsidian-plugin-helper/src/obsidian';
import { BUILTIN_BOOKMARK_ICONS } from '../../constants/icons';
import { RulePage } from '../../model/rule';
import IconicPlugin from '../../main';
import BookmarkIconManager from '../../managers/bookmark-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the bookmarks pane.
 */
export default class BookmarksIconRenderer extends IconRenderer {
	public readonly view: BookmarksView;
	public readonly iconManager: BookmarkIconManager;
	public readonly webviewerPlugin: WebviewerPluginInstance;

	constructor(plugin: IconicPlugin, view: BookmarksView) {
		super(plugin, view);
		this.view = view;
		this.webviewerPlugin = this.app.internalPlugins.getPluginById('webviewer').instance;
		this.iconManager = plugin.bookmarkIconManager;

		// Will automatically unload this renderer when the bookmarks view was
		// unloaded.
		this.view.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link view}.
	 */
	public load(): void {
		super.load();
		this.view.iconRenderer = this;
	}

	/**
	 * Unload and detach this renderer from the {@link view}.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.view, 'iconRenderer');
	}

	public onload(): void {
		super.onload();

		// Append all iconEls to all tree items.
		this.app.workspace.onLayoutReady(async () => {
			// TODO: Use better approach instead of waiting sleep timeout
			await sleep(500);
			await this.plugin.firstResolve;
			this.appendAllIconEls();
		});

		this.registerEvent(this.iconManager.bookmarksPlugin.on('add', async item => {
			// TODO: Use better approach instead of waiting sleep timeout
			await sleep(500);
			let id = item.ctime.toString();
			if (item.type === 'group') this.appendSingleIconEl(id);
			else this.renderSingle(id);
		}));

		// Update all file/folder icons whenever the rules were updated.
		this.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			this.renderBookmarkedFiles(page);
		}));

		// Rerender all file/folder icons when one of these settings was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			let page: RulePage | undefined;
			if ('useProperty' in changed || 'showAllFileIcons' in changed) page = 'file';
			if ('showAllFolderIcons' in changed) {
				if (!page) page = 'folder';
				else page = undefined;
			}
			this.renderBookmarkedFiles(page);
		}));

		// Update corresponding bookmarked files on rule react event.
		this.registerEvent(this.plugin.ruleManager.on('iconic:react', filepath => {
			let stored = this.iconManager.bookmarkedFileLookup[filepath];
			if (!stored) return;
			stored.forEach(({ ctime }) => this.renderSingle(ctime.toString()));
		}));
	}

	/**
	 * Run when this renderer was unloaded.
	 */
	public override onunload(): void {
		// Revert to the default icon when the bookmarks view is still loaded.
		if (this.view._loaded) iterateTreeNode(this.view.tree, treeItem => {
			treeItem.iconEl.removeClass('iconic-icon');
			if ('vChildren' in treeItem) {
				treeItem.iconEl.detach();
				Reflect.deleteProperty(treeItem, 'iconEl');
			} else if ('url' in treeItem.item) {
				// Use favicon for bookmarked url.
				this.webviewerPlugin.db.setIcon(treeItem.iconEl, treeItem.item.url);
			} else {
				let iconName = BUILTIN_BOOKMARK_ICONS.get(treeItem.item.type)!;
				treeItem.iconEl.empty();
				setIcon(treeItem.iconEl, iconName);
			}
		});
	}

	/**
	 * (Re)render icon for a single bookmark.
	 * 
	 * @param id Bookmark timestamp.
	 */
	protected renderSingle(id: string): void {
		let iconItem = this.iconManager.getIconItem(id),
			bookmarkItem = this.iconManager.bookmarkMap[id],
			treeItem = this.view.itemDoms.get(bookmarkItem),
			iconEl = treeItem && treeItem.iconEl;
		
		if (!iconEl || !treeItem) return;

		let icon = iconItem.icon ?? iconItem.iconDefault ?? '',
			{ color, category } = iconItem;

		// Set the element with the favicon instead.
		if (!iconItem.icon && 'url' in bookmarkItem) {
			iconEl.empty();
			this.webviewerPlugin.db.setIcon(iconEl, bookmarkItem.url).then(() => {
				let favIcon = iconEl.firstElementChild;
				if (!favIcon) return;
				favIcon.addEventListener('click', evt => {
					this.plugin.openIconPicker([{ id, category }]);
					evt.stopPropagation();
				});
			});
			return;
		}

		// If treeItem belongs to the group, use one of these icon instead.
		if (!iconItem.icon && 'vChildren' in treeItem)
			icon = treeItem.collapsed ? 'folder-closed' : 'folder-open';

		// Place the icon and render it.
		if (icon) {
			if ('path' in bookmarkItem) this.plugin.setIcon(iconEl, {
				id: bookmarkItem.path,
				category: bookmarkItem.type as 'file' | 'folder',
				icon, color
			}, { reuse: true });
			else this.plugin.setIcon(iconEl, { id, category, icon, color }, { reuse: true });
			if (bookmarkItem.type === 'group') iconEl.show();
		} else if (bookmarkItem.type === 'group') {
			iconEl.hide();
			iconEl.empty();
		}
	}

	/**
	 * Append an icon element to a single tree item.
	 */
	private appendSingleIconEl(id: string): void {
		let bookmarkItem = this.iconManager.bookmarkMap[id],
			treeItem = this.view.itemDoms.get(bookmarkItem)
		if (!treeItem) return;

		if ('collapsed' in treeItem) {
			treeItem.iconEl = createDiv({
				cls: ['iconic-sidekick', 'iconic-icon']
			});
			treeItem.innerEl.before(treeItem.iconEl);
		} else {
			treeItem.iconEl.addClass('iconic-icon');
		}

		this.renderSingle(id);
	}

	/**
	 * Append all icon elements to all tree items.
	 */
	private appendAllIconEls(): void {
		iterateTreeNode(this.view.tree, treeItem => {
			let id = treeItem.item.ctime.toString();
			if ('collapsed' in treeItem) this.appendSingleIconEl(id);
			else {
				treeItem.iconEl.addClass('iconic-icon');
				this.renderSingle(id);
			}
		});
	}

	/**
	 * Rerender all bookmarked file/folder icons.
	 */
	private renderBookmarkedFiles(page?: RulePage): void {
		let lookup = this.iconManager.bookmarkedFileLookup;
		for (let path in lookup) {
			let items = lookup[path];
			if (page && items[0]?.type !== page) continue;
			items.forEach(item => this.renderSingle(item.ctime.toString()));
		}
	}
}