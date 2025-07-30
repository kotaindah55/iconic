import { TagsPropertyWidget } from 'obsidian';
import IconicPlugin from '../../main';
import TagIconManager from '../../managers/tag-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering tag icons in the metadata editor.
 */
export default class TagPropertyIconRenderer extends IconRenderer {
	public propertyWidget: TagsPropertyWidget;
	public iconManager: TagIconManager;

	private oldChangeHandler: (value: unknown) => void;

	constructor(plugin: IconicPlugin, propertyWidget: TagsPropertyWidget) {
		super(plugin, propertyWidget);
		this.propertyWidget = propertyWidget;
		this.iconManager = plugin.tagIconManager;

		// Will automatically unload this renderer when the renderer was
		// unloaded.
		this.propertyWidget.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link propertyWidget}.
	 */
	public load(): void {
		this.propertyWidget.iconRenderer = this;
		super.load();
	}

	/**
	 * Unload and detach this renderer from the {@link propertyWidget}.
	 */
	public unload(): void {
		super.unload();
		delete this.propertyWidget.iconRenderer;
	}

	public onload(): void {
		super.onload();

		// Prepend an icon element to each tag element.
		this.renderAll();

		// Keep the icon rendered properly after the user edited the property.
		this.oldChangeHandler = this.propertyWidget.ctx.onChange;
		this.propertyWidget.ctx.onChange = (value: unknown) => {
			this.oldChangeHandler(value);
			this.renderAll();
		};
	}

	public override onunload(): void {
		// Remove all icons manually when the view is still loaded.
		if (this.propertyWidget._loaded) {
			this.propertyWidget.multiselect.elements.forEach(tagEl => {
				tagEl.find(':scope > .iconic-icon')?.detach();
			});
			
			// Revert change handler to its original.
			this.propertyWidget.ctx.onChange = this.oldChangeHandler;
		}
	}

	/**
	 * (Re)render icon for a single tag.
	 * 
	 * @param id Tag name, prefixed with hash (`#`).
	 */
	protected renderSingle(id: string): void {
		let { multiselect } = this.propertyWidget,
			strippedTag = id.replace(/^#/, ''),
			tagIndex = multiselect.values.indexOf(strippedTag),
			tagEl = multiselect.elements[tagIndex],
			iconEl = tagEl.find(':scope > .iconic-icon');
		
		// Prepend an icon element if it didn't exist.
		iconEl ??= tagEl.createDiv({ cls: 'iconic-icon', prepend: true });

		// Render/hide tag icon.
		let { icon, color, category } = this.iconManager.getIconItem(id);
		if (icon) this.plugin.setIcon(
			iconEl,
			{ id, category, icon, color },
			{ reuse: true }
		);
		else iconEl.empty();
	}

	/**
	 * (Re)render icon for all the tags.
	 */
	private renderAll(): void {
		let { values: tags } = this.propertyWidget.multiselect;
		tags.forEach(val => this.renderSingle('#' + val));
	}
}