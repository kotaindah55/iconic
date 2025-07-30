import { MetadataEditor, setIcon } from 'obsidian';
import IconicPlugin from '../../main';
import PropertyIconManager from '../../managers/property-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the metadata editor interface.
 */
export default class MetadataEditorIconRenderer extends IconRenderer {
	public readonly metadataEditor: MetadataEditor;
	public readonly iconManager: PropertyIconManager;

	constructor(plugin: IconicPlugin, metadataEditor: MetadataEditor) {
		super(plugin, metadataEditor);
		this.metadataEditor = metadataEditor;
		this.iconManager = plugin.propertyIconManager;

		// Will automatically unload this renderer when the metadataEditor was
		// unloaded.
		this.metadataEditor.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link metadataEditor}.
	 */
	public load(): void {
		this.metadataEditor.iconRenderer = this;
		super.load();
	}

	/**
	 * Unload and detach this renderer from the {@link metadataEditor}.
	 */
	public unload(): void {
		super.unload();
		Reflect.deleteProperty(this.metadataEditor, 'iconRenderer');
	}

	public onload(): void {
		super.onload();

		this.metadataEditor.rendered.forEach(propEditor => {
			if (!propEditor.entry) return;
			if (propEditor.iconEl.hasClass('iconic-icon')) return;
			propEditor.iconEl.addClass('iconic-icon');
			this.renderSingle(propEditor.entry.key);
		});
	}

	public override onunload(): void {
		if (this.metadataEditor._loaded)
			this.revert();
	}

	/**
	 * (Re)render icon for a single property.
	 * 
	 * @param id Property key/name.
	 */
	protected renderSingle(id: string): void {
		let targetProp = this.metadataEditor.rendered.find(prop => {
				return prop.entry?.key === id
			}),
			iconItem = this.iconManager.getIconItem(id),
			icon = iconItem.icon ?? iconItem.iconDefault,
			{ color, category } = iconItem;

		if (targetProp && icon) this.plugin.setIcon(
			targetProp.iconEl,
			{ id, category, icon, color },
			{ rightClick: true, openMenu: true }
		);
	}

	/**
	 * Revert all property icons to their default.
	 */
	private revert(): void {
		this.metadataEditor.rendered.forEach(prop => {
			let defaultIcon = prop.typeInfo.expected.icon;
			prop.iconEl.removeClass('iconic-icon');
			prop.iconEl.empty();
			setIcon(prop.iconEl, defaultIcon);
		});
	}
}