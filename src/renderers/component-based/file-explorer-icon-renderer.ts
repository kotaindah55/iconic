import { FileExplorerView } from 'obsidian';
import { isFile, isFolder, iterateAbstractFilesAsync } from '../../@external/obsidian-plugin-helper/obsidian';
import { TaskerState, Tasker } from '../../@external/obsidian-plugin-helper/global';
import { RulePage } from '../../model/rule';
import IconicPlugin from '../../main';
import FileIconManager from '../../managers/file-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the file explorer pane.
 */
export default class FileExplorerIconRenderer extends IconRenderer {
	public readonly view: FileExplorerView;
	public readonly iconManager: FileIconManager;

	private readonly tasker: Tasker;

	constructor(plugin: IconicPlugin, view: FileExplorerView) {
		super(plugin, view);
		this.view = view;
		this.iconManager = plugin.fileIconManager;
		this.tasker = new Tasker();

		// Will automatically unload this renderer when the file explorer was
		// unloaded.
		this.view.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link view}.
	 */
	public load(): void {
		this.view.iconRenderer = this;
		super.load();
	}

	/**
	 * Unload and detach this renderer from the {@link view}.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.view, 'iconRenderer');
	}

	/**
	 * Overriden `onload()`, with the purpose of {@link tasker} wrapping.
	 */
	public override onload(): void {
		let renderCallback = (id: string) => this.tasker.queue(async () => this.renderSingle(id));

		// Wait for all files to be resolved at the first time.
		this.tasker.queue(() => this.plugin.firstResolve);

		// Call when user added, changed, or deleted an icon.
		this.registerEvent(this.iconManager.on('iconic:add', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:change', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:delete', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:refresh', renderCallback));

		// Rerender the icon on rule manager "react" event, in the result of
		// file property update/change.
		this.registerEvent(this.plugin.ruleManager.on('iconic:react', renderCallback));

		// Update all file/folder icons whenever the rules were updated.
		this.registerEvent(
			this.plugin.ruleManager.on('iconic:update', page => this.refreshAll(page)
		));

		// Update some icons when a specific setting was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			let page: RulePage | 'all' | undefined,
				{ useProperty } = this.plugin.settings;

			if (
				'showAllFileIcons' in changed ||
				'useProperty' in changed ||
				useProperty && ('iconProperty' in changed || 'colorProperty' in changed)
			) {
				page = 'file';
			}
			if ('showAllFolderIcons' in changed) {
				if (page) page = 'folder';
				else page = 'all';
			}

			if (page) this.refreshAll(page);
		}));

		// Unload this component as soon as the plugin was unloaded.
		this.registerEvent(
			this.app.workspace.on('iconic:plugin-unload', () => this.parent?.removeChild(this))
		);

		// Append all iconEls to all tree items.
		this.tasker.queue(state => this.appendAllIconEls(state));

		// Append an iconEl to the newly created tree item.
		this.registerEvent(this.app.vault.on('create', ({ path: id }) =>
			this.tasker.queue(async () => this.appendSingleIconEl(id), 0)
		));
	}

	public override onunload(): void {
		// Stop any running task.
		this.tasker.cancel();

		// Remove all icons manually when the view is still loaded.
		if (this.view._loaded) {
			let { fileItems } = this.view;
			for (let id in fileItems) {
				fileItems[id].iconEl?.detach();
				Reflect.deleteProperty(fileItems[id], 'iconEl');
			}
		}
	}

	/**
	 * (Re)render icon for a single file/folder.
	 * 
	 * @param id Target file path.
	 */
	protected renderSingle(id: string): void {
		let { showAllFolderIcons } = this.plugin.settings,
			iconItem = this.iconManager.getIconItem(id),
			treeItem = this.view.fileItems[id],
			iconEl = treeItem?.iconEl;
		
		if (!iconEl || !treeItem) return;

		let icon = iconItem.icon ?? iconItem.iconDefault ?? '',
			{ color, category } = iconItem;

		// If treeItem belongs to the folder, use one of these icon instead.
		if (!iconItem.icon && 'vChildren' in treeItem && showAllFolderIcons)
			icon = treeItem.collapsed ? 'folder-closed' : 'folder-open';

		// Place the icon and render it.
		if (icon) {
			this.plugin.setIcon(
				iconEl,
				{ id, category, icon, color },
				{ reuse: true }
			);
			iconEl.show();
		} else {
			iconEl.hide();
			iconEl.empty();
		}
	}

	/**
	 * Append an icon element to a single tree item.
	 */
	private appendSingleIconEl(id: string): void {
		let treeItem = this.view.fileItems[id],
			iconEl = createDiv({ cls: 'iconic-icon' });

		// Place the icon element before the inner text el.
		treeItem.iconEl = iconEl;
		treeItem.innerEl.before(iconEl);

		if ('vChildren' in treeItem) iconEl.addClass('iconic-sidekick');
		else iconEl.addClass('tree-item-icon');
		this.renderSingle(id);
	}

	/**
	 * Append an icon element to each available tree item.
	 * @remark wrap this method with `tasker.queue()` to run it.
	 */
	private async appendAllIconEls(state?: TaskerState): Promise<void> {
		let amount = 0;
		for (let id in this.view.fileItems) {
			this.appendSingleIconEl(id);
			// Keep the UI responsive on vault with large number of files.
			amount++;
			if (amount % 100 === 0) {
				// Do short circuit when needed, e.g. before unloading the plugin.
				if (state?.mustCancelCurrent) return;
				await sleep(5);
			}
		}
	}

	/**
	 * Refresh all file and/or folder icons.
	 */
	private refreshAll(page: RulePage | 'all' = 'all'): void {
		let amount = 0,
			label = `refresh-${page}`;

		if (page != 'folder') this.tasker.cancelLabel('refresh-file');
		if (page != 'file') this.tasker.cancelLabel('refresh-folder');
		if (page == 'all') this.tasker.cancelLabel('refresh-all');

		this.tasker.queue(state => iterateAbstractFilesAsync(this.app, async file => {
			if (isFile(file) && page == 'folder') return;
			if (isFolder(file) && page == 'file') return;
			this.renderSingle(file.path);

			// Keep the UI responsive on vault with large number of files.
			amount++;
			if (amount % 100 === 0) {
				// Do short circuit when needed, e.g. before unloading the plugin.
				if (state?.mustCancelCurrent) return;
				await sleep(5);
			}
		}), 5, label);
	}
}