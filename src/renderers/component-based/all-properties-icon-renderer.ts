import { AllPropertiesView, setIcon } from 'obsidian';
import IconicPlugin from '../../main';
import PropertyIconManager from '../../managers/property-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering icons in the all properties view.
 */
export default class AllPropertiesIconRenderer extends IconRenderer {
	public readonly view: AllPropertiesView;
	public readonly iconManager: PropertyIconManager;

	constructor(plugin: IconicPlugin, view: AllPropertiesView) {
		super(plugin, view);
		this.view = view;
		this.iconManager = plugin.propertyIconManager;

		// Will automatically unload this renderer when the all properties was
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

	public override onunload(): void {
		// Revert all icons manually when the view is still loaded.
		if (this.view._loaded) for (let id in this.view.doms) {
			let { metadataTypeManager } = this.app,
				treePropItem = this.view.doms[id],
				emptyPropEntry = Object.assign({}, treePropItem.property, { value: undefined }),
				typeInfo = metadataTypeManager.getTypeInfo(emptyPropEntry),
				iconName = typeInfo.expected.icon ?? 'lucide-file-question',
				{ iconEl } = treePropItem;
			
			// Empty iconEl first, avoiding from using previous icon if has the same
			// name.
			iconEl.empty();
			iconEl.removeClass('iconic-icon');
			setIcon(iconEl, iconName);
		}
	}

	/**
	 * (Re)render icon for a single property.
	 * 
	 * @param id Target property name/key.
	 */
	protected renderSingle(id: string): void {
		let iconItem = this.iconManager.getIconItem(id),
			icon = iconItem.icon ?? iconItem.iconDefault!,
			{ color, category } = iconItem,
			iconEl = this.view.doms[id]?.iconEl;
		
		if (!iconEl) return;
		this.plugin.setIcon(iconEl, { id, category, icon, color });
	}
}