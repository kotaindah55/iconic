import { WorkspaceLeaf } from 'obsidian';
import { getFilepathFromLeaf } from '../@external/obsidian-plugin-helper/src/obsidian';
import { OPENABLE_FILE_TYPES } from '../constants/view-types';
import { IconBase, IconItem, IconItemCategory } from '../model/icon-item';
import { ItemDesc } from '../dialogs/icon-picker';
import IconicPlugin from '../main';
import IconManager from './icon-manager';

/**
 * Manage icons for the leaves.
 */
export default class LeafIconManager extends IconManager {
	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.iconMap = plugin.settings.leafIcons;
	}

	/**
	 * Add an icon to the corresponding leaf.
	 */
	public addIconLeaf(leaf: WorkspaceLeaf, icon: string, color?: string): void {
		this.addIcon(leaf.view.getViewType(), icon, color);
	}

	/**
	 * Change the icon of the corresponding leaf.
	 */
	public changeIconLeaf(leaf: WorkspaceLeaf, icon: string, color?: string): void {
		this.changeIcon(leaf.view.getViewType(), icon, color);
	}

	/**
	 * Delete the icon from the corresponding leaf.
	 */
	public deleteIconLeaf(leaf: WorkspaceLeaf): void {
		this.deleteIcon(leaf.view.getViewType());
	}

	/**
	 * Get user-defined icon item from corresponding id (view type).
	 * @param id View type.
	 */
	public getIconItem(id: string): IconItem {
		return Object.assign(
			{ id, category: 'leaf' as const },
			this.iconMap[id] ?? {}
		);
	}

	/**
	 * Get preferred icon item from the given leaf.
	 */
	public getLeafIcon(leaf: WorkspaceLeaf): IconBase & ItemDesc {
		// Could be a file path or the view type.
		let id = leaf.view.getViewType(),
			iconEl = leaf.tabHeaderInnerIconEl;
	
		// Add iconic class if it doesn't have it.
		iconEl.addClass('iconic-icon');
		
		// Check if the current leaf wraps FileView instance that has a file
		// inside.
		let filepath = getFilepathFromLeaf(leaf),
			category: IconItemCategory = 'leaf',
			icon: string,
			color: string | undefined;
		
		// If the type is one of the OPENABLE_FILE_TYPES, then use file icon
		// instead.
		if (filepath && OPENABLE_FILE_TYPES.has(id)) {
			let iconItem = this.plugin.fileIconManager.getIconItem(filepath);
			id = filepath;
			icon = iconItem.icon ?? iconItem.iconDefault ?? leaf.getIcon();
			color = iconItem.color;
			category = iconItem.category;
		} else {
			let iconItem = this.plugin.leafIconManager.getIconItem(id);
			icon = iconItem.icon ?? leaf.getIcon();
			color = iconItem.color;
		}
	
		return { id, category, icon, color };
	}
}