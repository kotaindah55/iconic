import { App, BookmarkItem, BookmarkItemFile, BookmarkItemFolder, BookmarksPluginInstance, TAbstractFile } from 'obsidian';
import { BUILTIN_BOOKMARK_ICONS } from '../constants/icons';
import { IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import IconManager from './icon-manager';
import FileIconManager from './file-icon-manager';

/**
 * Manage icons for the bookmark items, bookmarked files and folders are excluded.
 */
export default class BookmarkIconManager extends IconManager {
	public readonly bookmarksPlugin: BookmarksPluginInstance;
	public readonly fileIconManager: FileIconManager;

	/**
	 * Collection of bookmarks items mapped into their timestamp.
	 */
	public bookmarkMap: Record<string, BookmarkItem>;

	/**
	 * Lookup for the bookmarked files and folders.
	 */
	public bookmarkedFileLookup: Record<string, (BookmarkItemFile | BookmarkItemFolder)[]>;

	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.fileIconManager = plugin.fileIconManager;
		this.iconMap = plugin.settings.bookmarkIcons;
		this.bookmarksPlugin = this.app.internalPlugins.getPluginById('bookmarks').instance;
		this.bookmarkMap = {};
		this.bookmarkedFileLookup = {};

		// Populate and map bookmark items onto their timestamp.
		BookmarkIconManager.iterateBookmarkItems(this.app, item => {
			this.bookmarkMap[item.ctime] = item;
			// Also map them onto their path if they were bookmarked files/folders.
			if ('path' in item) {
				let stored = this.bookmarkedFileLookup[item.path] ??= [];
				stored.push(item as BookmarkItemFile | BookmarkItemFolder);
			}
		});

		// Delete the id when its corresponding bookmark was deleted.
		plugin.registerEvent(this.bookmarksPlugin.on('remove', item => {
			delete this.bookmarkMap[item.ctime];
			if ('path' in item) {
				let stored = this.bookmarkedFileLookup[item.path];
				stored.remove(item as BookmarkItemFile | BookmarkItemFolder);
				plugin.requestSave();
				return;
			}

			let id = item.ctime;
			delete this.iconMap[id];
		}));

		// Map newly added bookmark.
		plugin.registerEvent(this.bookmarksPlugin.on('add', item => {
			this.bookmarkMap[item.ctime] = item;
			plugin.requestSave();
		}));

		let refreshHandler = (path: string) => {
			let stored = this.bookmarkedFileLookup[path];
			if (!stored) return;
			stored.forEach(({ ctime: id }) => this.trigger('iconic:refresh', id));
		};

		// Trigger 'refresh' event as soon as fileIconManager 'add', 'change',
		// 'delete', and 'refresh' event was triggered, unless the passed id
		// (filepath) isn't available in the bookmarked file lookup.
		plugin.registerEvent(this.fileIconManager.on('iconic:add', refreshHandler));
		plugin.registerEvent(this.fileIconManager.on('iconic:change', refreshHandler));
		plugin.registerEvent(this.fileIconManager.on('iconic:delete', refreshHandler));
		plugin.registerEvent(this.fileIconManager.on('iconic:refresh', refreshHandler));
	}

	/**
	 * Add an icon to the corresponding bookmark item.
	 */
	public addIconFromBookmark(item: BookmarkItem, icon: string, color?: string): void {
		this.addIcon(item.ctime.toString(), icon, color);
	}

	/**
	 * Change the icon of the corresponding bookmark item.
	 */
	public changeIconFromBookmark(item: BookmarkItem, icon: string, color?: string): void {
		this.changeIcon(item.ctime.toString(), icon, color);
	}

	/**
	 * Delete the icon from the corresponding bookmark item.
	 */
	public deleteIconFromBookmark(item: BookmarkItem): void {
		this.deleteIcon(item.ctime.toString());
	}

	/**
	 * Get bookmark item of the {@link file} if exists.
	 */
	public getBookmarksFromFile(file: TAbstractFile): (BookmarkItemFile | BookmarkItemFolder)[] | undefined {
		return this.bookmarkedFileLookup[file.path];
	}

	/**
	 * Get corresponding file from the bookmark item.
	 * @returns If it's not a file/folder bookmark, it returns null.
	 */
	public getFileFromBookmark(itemOrId: BookmarkItem | string): TAbstractFile | null {
		let item = typeof itemOrId === 'string'
			? this.bookmarkMap[itemOrId]
			: itemOrId;

		if (!item || !('path' in item)) return null;

		return this.app.vault.getAbstractFileByPath(item.path);
	}

	/**
	 * Get icon item from corresponding id (bookmark timestamp).
	 * @param id Bookmark timestamp.
	 */
	public getIconItem(id: string): IconItem {
		let { showAllFolderIcons } = this.plugin.settings,
			bookmarkItem = this.bookmarkMap[id],
			isGroup = bookmarkItem.type === 'group',
			iconItem: IconItem = { id, category: 'bookmark' };

		// Assign mapped icon to the iconItem if any.
		if (bookmarkItem) Object.assign(iconItem, this.iconMap[id] ?? {});

		// Assign mapped file icon if the type is file/folder.
		if ('path' in bookmarkItem) {
			let fileIconItem = this.fileIconManager.getIconItem(bookmarkItem.path);
			iconItem.icon = fileIconItem.icon ?? fileIconItem.iconDefault;
			iconItem.color = fileIconItem.color;
		}

		// Get default bookmark icon.
		if (isGroup) {
			if (showAllFolderIcons) iconItem.iconDefault = 'folder-closed';
		} else {
			iconItem.iconDefault = BUILTIN_BOOKMARK_ICONS.get(bookmarkItem.type) ?? 'bookmark';
		}

		return iconItem;
	}

	/**
	 * Iterate all bookmark items and call {@link callback} for each item
	 * that's encountered.
	 */
	public static iterateBookmarkItems(app: App, callback: (item: BookmarkItem) => unknown): void {
		let bookmarkPlugin = app.internalPlugins.getEnabledPluginById('bookmarks');
		if (!bookmarkPlugin) return;

		let queue: BookmarkItem[][] = [bookmarkPlugin.items];
		for (let i = 0; i < queue.length; i++) {
			let curItems = queue[i];
			curItems.forEach(item => {
				callback(item);
				// Push children to the queue.
				if ('items' in item) queue.push(item.items);
			});
		}
	}
}