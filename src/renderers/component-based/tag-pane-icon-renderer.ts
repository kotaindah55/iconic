import { TagView } from 'obsidian';
import { iterateTreeNode } from '../../@external/obsidian-plugin-helper/obsidian';
import IconicPlugin from '../../main';
import TagIconManager from '../../managers/tag-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the tag pane.
 */
export default class TagPaneIconRenderer extends IconRenderer {
	public readonly view: TagView;
	public readonly iconManager: TagIconManager;

	constructor(plugin: IconicPlugin, view: TagView) {
		super(plugin, view);
		this.view = view;
		this.iconManager = plugin.tagIconManager;

		// Will automatically unload this renderer when the tag pane was unloaded.
		this.view.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link view}.
	 */
	public load(): void {
		this.view.iconRenderer = this;
		super.load();
	}

	public onload(): void {
		super.onload();

		// Appends an icon elemet to each tree item.
		iterateTreeNode(this.view.tree, item => {
			item.iconEl = createDiv({ cls: 'iconic-sidekick' });
			item.innerEl.before(item.iconEl);
			this.renderSingle(item.tag);
		});
	}

	/**
	 * Unload and detach this renderer from the {@link view}.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.view, 'iconRenderer');
	}

	public override onunload(): void {
		// Remove all icons manually when the view is still loaded.
		if (this.view._loaded) {
			let { tagDoms } = this.view;
			for (let id in tagDoms) {
				tagDoms[id].iconEl.detach();
				Reflect.deleteProperty(tagDoms[id], 'iconEl');
			}
		}
	}

	/**
	 * (Re)render icon for a single tag.
	 * 
	 * @param id Tag name, prefixed with hash (`#`).
	 */
	protected renderSingle(id: string): void {
		let iconItem = this.iconManager.getIconItem(id),
			treeItem = this.view.tagDoms[id],
			iconEl = treeItem?.iconEl;
		
		if (!iconEl || !treeItem) return;

		let { icon, color, category } = iconItem;

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
}