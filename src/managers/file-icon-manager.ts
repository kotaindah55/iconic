import { TAbstractFile } from 'obsidian';
import { getAbstractFile, isFile, isFolder } from '../@external/obsidian-plugin-helper/obsidian';
import { FILE_TYPE_MAP } from '../constants/file-types';
import { DEFAULT_FILE_ICONS } from '../constants/icons';
import { IconBase, IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import IconManager from './icon-manager';
import RuleManager from '../ruler/rule-manager';

/**
 * Manage icons for the files and folders.
 */
export default class FileIconManager extends IconManager {
	private readonly ruleManager: RuleManager;

	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.ruleManager = plugin.ruleManager;
		this.iconMap = plugin.settings.fileIcons;

		// Rename the id when its corresponding file was renamed.
		plugin.registerEvent(this.app.vault.on('rename', ({ path: newId }, oldId) => {
			if (this.iconMap[oldId]) {
				let iconBase = this.iconMap[oldId];
				delete this.iconMap[oldId];
				this.iconMap[newId] = iconBase;
				this.plugin.requestSave();
				// Rerender file icon when renamed.
				this.trigger('iconic:refresh', newId);
			} else if (this.iconMap[newId]) {
				this.trigger('iconic:refresh', newId);
			}
		}));

		// Delete the id when its corresponding file was deleted, if `rememberDeletedItems` is enabled.
		plugin.registerEvent(this.app.vault.on('delete', ({ path: id }) => {
			if (this.plugin.settings.rememberDeletedItems) return;
			delete this.iconMap[id];
			this.plugin.requestSave();
		}));
	}

	/**
	 * Add an icon to the corresponding file/folder.
	 */
	public addIconFromFile(file: TAbstractFile, icon: string, color?: string): void {
		this.addIcon(file.path, icon, color);
	}

	/**
	 * Change the icon of the corresponding file/folder.
	 */
	public changeIconFromFile(file: TAbstractFile, icon: string, color?: string): void {
		this.changeIcon(file.path, icon, color);
	}

	/**
	 * Delete the icon from the corresponding file/folder.
	 */
	public deleteIconFromFile(file: TAbstractFile): void {
		this.deleteIcon(file.path);
	}

	/**
	 * Get icon item from corresponding id (filepath).
	 * 
	 * @param id File/folder path.
	 */
	public getIconItem(id: string): IconItem {
		let { showAllFileIcons, showAllFolderIcons, useProperty, iconProperty, colorProperty } = this.plugin.settings,
			file = getAbstractFile(this.app, id),
			iconBase: IconBase | undefined = this.iconMap[id],
			iconItem: IconItem = {
				id,
				category: isFolder(file) ? 'folder' : 'file'
			};

		// Use icon from the property if any.
		if (!iconBase && isFile(file) && useProperty) {
			let frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter,
				iconFromProp = frontmatter?.[iconProperty],
				colorFromProp = frontmatter?.[colorProperty];
			if (iconFromProp && typeof iconFromProp === 'string') {
				iconBase = { icon: iconFromProp };
				if (colorFromProp && typeof colorFromProp === 'string')
					iconBase.color ??= colorFromProp;
			}
		}
		
		// Use the rule icon from the rule manager consequently.
		if (file) iconBase ??= this.ruleManager.getIconBase(file);

		// Assign iconBase properties to the iconItem.
		if (iconBase) Object.assign(iconItem, iconBase);

		// Get default file icon.
		if (isFolder(file)) {
			if (showAllFolderIcons) iconItem.iconDefault = 'lucide-folder';
		} else if (showAllFileIcons) {
			if (isFile(file)) {
				let type = FILE_TYPE_MAP[file.extension];
				iconItem.iconDefault = DEFAULT_FILE_ICONS.get(type) ?? 'file';
			} else {
				iconItem.iconDefault = 'file';
			}
		}

		return iconItem;
	}
}