import { Menu, RibbonItem, setIcon, WorkspaceRibbon } from 'obsidian';
import { MouseBtn } from '../../constants/mouse-button';
import IconicPlugin from '../../main';
import RibbonIconManager from '../../managers/ribbon-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the left ribbon.
 */
export default class RibbonIconRenderer extends IconRenderer {
	public readonly ribbon: WorkspaceRibbon;
	public readonly iconManager: RibbonIconManager;

	constructor(plugin: IconicPlugin) {
		super(plugin);
		this.ribbon = plugin.app.workspace.leftRibbon;
		this.iconManager = plugin.ribbonIconManager;

		// Will automatically unload this renderer when the plugin was
		// unloaded.
		this.plugin.addChild(this);
	}

	/**
	 * Load this renderer and attach it to the workspace.
	 */
	public load(): void {
		this.ribbon.iconRenderer = this;
		super.load();
	}

	/**
	 * Unload this renderer and detach it from the workspace.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.ribbon, 'iconRenderer');
	}

	public onload(): void {
		super.onload();

		// Rerender each ribbon icon and register menu handler.
		this.ribbon.items.forEach(item => {
			if (!item.buttonEl) return;
			this.attachMenuHandler(item);
			this.renderRibbonIcon(item);
		});
	}

	public override onunload(): void {
		// Revert each ribbon icon.
		this.ribbon.items.forEach(item => {
			if (!item.buttonEl) return;
			item.buttonEl.empty();
			setIcon(item.buttonEl, item.icon);
		});
	}

	/**
	 * Attach menu handler to the ribbon item.
	 */
	public attachMenuHandler(item: RibbonItem) {
		if (!item.buttonEl) return;

		let { id } = item,
			category = 'ribbon' as const;

		// Register menu handler.
		this.registerDomEvent(
			item.buttonEl,
			'contextmenu',
			evt => {
				if (!this.plugin.actionMenu) return;
				this.plugin.extendMenu(Menu.forEvent(evt), [{ id, category }]);
			}
		);

		// Prevent right click from using left click behavior.
		this.registerDomEvent(item.buttonEl, 'auxclick', evt => {
			if (evt.button === MouseBtn.RIGHT) {
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
			}
		}, { capture: true });
	}

	/**
	 * (Re)render icon for a single ribbon button.
	 */
	public renderRibbonIcon(item: RibbonItem): void {
		if (!item.buttonEl) return;

		let iconItem = this.iconManager.getIconItem(item.id),
			icon = iconItem.icon ?? item.icon,
			{ color, category, id } = iconItem;
		
		// Render user-defined leaf icon if any.
		this.plugin.setIcon(
			item.buttonEl,
			{ id, category, icon, color },
			{ noHandler: true }
		);
	}

	/**
	 * (Re)render icon for a single ribbon item.
	 * 
	 * @param id Ribbon item id.
	 */
	protected renderSingle(id: string): void {
		let ribbonItem = this.ribbon.items.find(item => item.id === id);
		if (ribbonItem) this.renderRibbonIcon(ribbonItem);
	}
}