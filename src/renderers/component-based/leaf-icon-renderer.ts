import { TFile, Workspace, WorkspaceLeaf } from 'obsidian';
import { getFilepathFromLeaf } from '../../@external/obsidian-plugin-helper/src/obsidian';
import { OPENABLE_FILE_TYPES } from '../../constants/view-types';
import { getLeavesOfOpenableFile } from '../../utils/workspace-utils';
import { IconItemCategory } from '../../model/icon-item';
import IconicPlugin from '../../main';
import FileIconManager from '../../managers/file-icon-manager';
import LeafIconManager from '../../managers/leaf-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons for leaf tabs.
 */
export default class LeafIconRenderer extends IconRenderer {
	public readonly workspace: Workspace;
	public readonly iconManager: LeafIconManager;
	public readonly fileIconManager: FileIconManager;

	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.workspace = this.app.workspace;
		this.iconManager = plugin.leafIconManager;
		this.fileIconManager = plugin.fileIconManager;

		// Will automatically unload this renderer when the plugin was
		// unloaded.
		this.plugin.addChild(this);
	}

	/**
	 * Load this renderer and attach it to the workspace.
	 */
	public load(): void {
		this.workspace.iconRenderer = this;
		super.load();
	}

	/**
	 * Unload this renderer and detach it from the workspace.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.workspace, 'iconRenderer');
	}

	public onload(): void {
		super.onload();
		this.refreshAllTabHeaders();

		// React to the fileIconManager events.
		this.registerEvent(
			this.fileIconManager.on('iconic:add', filepath => this.renderByFile(filepath))
		);
		this.registerEvent(
			this.fileIconManager.on('iconic:change', filepath => this.renderByFile(filepath))
		);
		this.registerEvent(
			this.fileIconManager.on('iconic:delete', filepath => this.renderByFile(filepath))
		);
		this.registerEvent(
			this.fileIconManager.on('iconic:refresh', filepath => this.renderByFile(filepath))
		);

		// React to the ruleManager events.
		this.registerEvent(
			this.plugin.ruleManager.on('iconic:react', filepath => this.renderByFile(filepath))
		);
		this.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			if (page === 'file') this.renderAllFileViewLeaves();
		}));

		// Provide icon altering from the leaf menu.
		this.registerEvent(this.workspace.on('leaf-menu', (menu, leaf) => {
			if (!this.plugin.actionMenu) return;
			let id = leaf.view.getViewType(),
				category = 'leaf' as const;
			// Icon change option has already been provided by the file menu.
			if (OPENABLE_FILE_TYPES.has(id)) return;
			this.plugin.extendMenu(menu, [{ id, category }]);
		}));

		// Rerender the icon when one of these settings was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			if ('useProperty' in changed || 'showAllFileIcons' in changed)
				this.renderAllFileViewLeaves();
		}));

		
	}

	public override onunload(): void {
		// Revert all tab icons to their default.
		this.workspace.iterateAllLeaves(leaf => {
			leaf.tabHeaderInnerIconEl.removeClass('iconic-icon');
			leaf.updateHeader();
		});
	}

	/**
	 * (Re)render icon for a single leaf.
	 */
	public renderLeaf(leaf: WorkspaceLeaf): void {
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
			let iconItem = this.fileIconManager.getIconItem(filepath);
			id = filepath;
			icon = iconItem.icon ?? iconItem.iconDefault ?? leaf.getIcon();
			color = iconItem.color;
			category = iconItem.category;
		} else {
			let iconItem = this.iconManager.getIconItem(id);
			icon = iconItem.icon ?? leaf.getIcon();
			color = iconItem.color;
		}

		this.plugin.setIcon(
			iconEl,
			{ id, category, icon, color },
			{ reuse: true, noHandler: true }
		);
	}

	/**
	 * (Re)render icon for a single leaf type, may render more than one leaf.
	 * 
	 * @param id The type of the leaf's view.
	 */
	protected renderSingle(id: string): void {
		let leaves = this.workspace.getLeavesOfType(id);
		leaves.forEach(leaf => this.renderLeaf(leaf));
	}

	/**
	 * (Re)render icon for the leaves that associate with the given file.
	 * @param fileOrPath Either {@link TFile} or the file path.
	 */
	private renderByFile(fileOrPath: TFile | string): void {
		// If the argument is filepath, then try to get its TFile.
		let file: TFile | null;
		if (fileOrPath instanceof TFile) file = fileOrPath;
		else file = this.app.vault.getFileByPath(fileOrPath);
		if (!file) return;

		// Get matched leaves and render their icon.
		getLeavesOfOpenableFile(this.workspace, file).forEach(leaf => {
			this.renderLeaf(leaf);
		});
	}

	/**
	 * (Re)render all available leaves of the file views.
	 */
	private renderAllFileViewLeaves(): void {
		this.workspace.iterateAllLeaves(leaf => {
			let viewType = leaf.view.getViewType();
			if (!OPENABLE_FILE_TYPES.has(viewType)) return;
			this.renderLeaf(leaf);
		});
	}

	/**
	 * Refresh all available tab headers.
	 */
	private async refreshAllTabHeaders(): Promise<void> {
		await this.plugin.firstResolve;
		this.workspace.iterateAllLeaves(leaf => {
			leaf.tabHeaderInnerIconEl.empty();
			leaf.updateHeader();
		});
	}
}