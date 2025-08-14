import { GlobalSearchView } from 'obsidian';
import { Tasker } from '../../@external/obsidian-plugin-helper/src/global';
import IconRenderer from './icon-renderer';
import FileIconManager from '../../managers/file-icon-manager';
import IconicPlugin from '../../main';

/**
 * Responsible for rendering icons in the global search pane.
 */
export default class GlobalSearchIconRenderer extends IconRenderer {
	public readonly view: GlobalSearchView;
	public readonly iconManager: FileIconManager;
	public readonly tasker: Tasker;

	constructor(plugin: IconicPlugin, view: GlobalSearchView) {
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
		this.view.dom.view = this.view;
		super.load();
	}

	/**
	 * Unload and detach this renderer from the {@link view}.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.view, 'iconRenderer');
		Reflect.deleteProperty(this.view.dom, 'view');
	}

	/**
	 * Overriden `onload()`, with the purpose of {@link tasker} wrapping.
	 */
	public override onload(): void {
		let renderCallback = (id: string) => this.tasker.enqueue(async () => this.renderSingle(id));

		// Wait for all files to be resolved at the first time.
		this.tasker.enqueue(() => this.plugin.firstResolve);

		// Call when user added, changed, or deleted an icon.
		this.registerEvent(this.iconManager.on('iconic:add', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:change', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:delete', renderCallback));
		this.registerEvent(this.iconManager.on('iconic:refresh', renderCallback));

		// Rerender the icon on rule manager "react" event, in the result of
		// file property update/change.
		this.registerEvent(this.plugin.ruleManager.on('iconic:react', renderCallback));

		// Update all file icons whenever the rules were updated.
		this.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			if (page === 'file') this.refreshAll();
		}));

		// Update some icons when a specific setting was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			let { useProperty } = this.plugin.settings;

			if (
				'showAllFileIcons' in changed ||
				'useProperty' in changed ||
				useProperty && ('iconProperty' in changed || 'colorProperty' in changed)
			) {
				this.refreshAll();
			}
		}));

		// Unload this component as soon as the plugin was unloaded.
		this.registerEvent(
			this.app.workspace.on('iconic:plugin-unload', () => this.parent?.removeChild(this))
		);
	}

	public override onunload(): void {
		// Stop any running task.
		this.tasker.cancel();

		// Remove all icons manually when the view is still loaded.
		if (this.view._loaded) {
			let treeItems = this.view.dom.vChildren._children;
			treeItems.forEach(item => item.iconEl?.detach());
		}
	}

	/**
	 * (Re)render icon for a single file/folder.
	 * 
	 * @param id Target file path.
	 */
	protected renderSingle(id: string): void {
		let file = this.app.vault.getFileByPath(id),
			iconItem = this.iconManager.getIconItem(id),
			treeItem = file && this.view.dom.resultDomLookup.get(file),
			iconEl = treeItem?.iconEl;
		
		if (!iconEl || !treeItem) return;

		let icon = iconItem.icon ?? iconItem.iconDefault ?? '',
			{ color, category } = iconItem;

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
	public appendSingleIconEl(id: string): void {
		let file = this.app.vault.getFileByPath(id),
			treeItem = file && this.view.dom.resultDomLookup.get(file);

		if (!treeItem) return;
		
		let iconEl = createDiv({ cls: ['iconic-icon', 'iconic-sidekick'] });

		// Place the icon element after the collapse button.
		treeItem.iconEl = iconEl;
		treeItem.collapseEl?.before(iconEl);

		this.renderSingle(id);
	}

	/**
	 * Refresh all file icons.
	 */
	private refreshAll(): void {
		let amount = 0;

		// Cancel already running refresh.
		this.tasker.cancelLabel('refresh');

		this.tasker.enqueue(async state => {
			let treeItems = this.view.dom.vChildren._children;
			for (let i = 0; i < treeItems.length; i++) {
				let id = treeItems[i].file.path;
				this.renderSingle(id);

				// Keep the UI responsive on vault with large number of files.
				amount++;
				if (amount % 100 === 0) {
					// Do short circuit when needed, e.g. before unloading the plugin.
					if (state?.cancelCurrent) return;
					await sleep(5);
				}
			}
		}, 5, 'refresh');
	}
}