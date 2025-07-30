import { WorkspaceLeaf } from 'obsidian';
import { IconItem } from '../model/icon-item';
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
	 * Get icon item from corresponding id (view type).
	 * @param id View type.
	 */
	public getIconItem(id: string): IconItem {
		return Object.assign(
			{ id, category: 'leaf' as const },
			this.iconMap[id] ?? {}
		);
	}
}