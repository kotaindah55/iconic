import { MultiTextPropertyWidget, TextPropertyWidget } from 'obsidian';
import { getPathFromWikilink, isWikilink } from '../../@external/obsidian-plugin-helper/obsidian';
import IconicPlugin from '../../main';
import FileIconManager from '../../managers/file-icon-manager';
import IconRenderer from './icon-renderer';

/**
 * Responsible for rendering file icons from internal link in the
 * metadata editor.
 */
export default class FilePropertyIconRenderer extends IconRenderer {
	public propertyWidget: TextPropertyWidget | MultiTextPropertyWidget;
	public iconManager: FileIconManager;

	private oldChangeHandler: (value: unknown) => void;

	constructor(plugin: IconicPlugin, propertyWidget: TextPropertyWidget | MultiTextPropertyWidget) {
		super(plugin, propertyWidget);
		this.propertyWidget = propertyWidget;
		this.iconManager = plugin.fileIconManager;

		// Will automatically unload this renderer when the widget was
		// unloaded.
		this.propertyWidget.addChild(this);
	}

	/**
	 * Load and attach this renderer to the {@link propertyWidget}.
	 */
	public load(): void {
		// this.propertyRenderer.iconRenderer = this;
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

		// Prepend an icon element to each link element.
		this.renderAll();

		// Keep the icon rendered properly after the user edited the property.
		this.oldChangeHandler = this.propertyWidget.ctx.onChange;
		this.propertyWidget.ctx.onChange = (value: unknown) => {
			this.oldChangeHandler(value);
			this.renderAll();
		};

		// React on rule react event.
		this.registerEvent(
			this.plugin.ruleManager.on('iconic:react', id => this.renderSingle(id))
		);

		// Rerender all icons when any file rule was updated.
		this.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			if (page === 'file') this.renderAll();
		}));

		// Rerender all icons when one of these settings was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			if ('useProperty' in changed || 'showAllFileIcons' in changed)
				this.renderAll();
		}));
	}

	public override onunload(): void {
		// Remove all icons manually when the view is still loaded.
		if (!this.propertyWidget._loaded) return;

		// Revert change handler to its original.
		this.propertyWidget.ctx.onChange = this.oldChangeHandler;

		if ('multiselect' in this.propertyWidget) {
			this.propertyWidget.multiselect.elements.forEach(tagEl => {
				tagEl.find(':scope > .iconic-icon')?.detach();
			});
		} else {
			this.propertyWidget.linkTextEl.find(':scope > .iconic-icon')?.detach();
		}
	}

	/**
	 * (Re)render icon for a single file link.
	 * 
	 * @param id File path.
	 */
	protected renderSingle(id: string): void {
		let linkEls: HTMLElement[] = [];

		// Find matched links from the multitext property.
		if ('multiselect' in this.propertyWidget) {
			let { multiselect } = this.propertyWidget,
				{ values: links } = multiselect;
			links.forEach((link, index) => {
				if (!isWikilink(link)) return;
				let linkpath = getPathFromWikilink(link),
					file = this.app.metadataCache.getFirstLinkpathDest(linkpath, '');
				if (file?.path === id)
					linkEls.push(multiselect.elements[index]);
			});
		}

		// Check whether the link element matched with the given id.
		else if (this.propertyWidget.isWikilink()) {
			let link = this.propertyWidget.getLinkText(),
				linkpath = getPathFromWikilink(link),
				file = this.app.metadataCache.getFirstLinkpathDest(linkpath, '');
			if (file?.path === id)
				linkEls.push(this.propertyWidget.linkTextEl);
		}

		linkEls.forEach(linkEl => {
			let iconEl = linkEl.find(':scope > .iconic-icon');
			// Prepend an icon element if it didn't exist.
			iconEl ??= linkEl.createDiv({ cls: 'iconic-icon', prepend: true });
			// Render/hide tag icon.
			let { icon, iconDefault, color, category } = this.iconManager.getIconItem(id);
			icon ??= iconDefault;
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
		});
	}

	/**
	 * (Re)render icon for all the links.
	 */
	private renderAll(): void {
		// Link elements mapped onto its linkpath.
		let linkElMap: Record<string, HTMLElement> = {};

		// For multitext property.
		if ('multiselect' in this.propertyWidget) {
			let { multiselect } = this.propertyWidget,
				{ values: links } = multiselect;
			links.forEach((link, index) => {
				if (!isWikilink(link)) return;
				let linkpath = getPathFromWikilink(link);
				linkElMap[linkpath] = multiselect.elements[index];
			});
		}
		
		// For text property.
		else if (this.propertyWidget.isWikilink()) {
			let link = this.propertyWidget.getLinkText(),
				linkpath = getPathFromWikilink(link);
			linkElMap[linkpath] = this.propertyWidget.linkTextEl;
		}

		for (let linkpath in linkElMap) {
			// Check if the link is valid.
			let file = this.app.metadataCache.getFirstLinkpathDest(linkpath, '');
			if (!file) continue;

			let linkEl = linkElMap[linkpath],
				iconEl = linkEl.find(':scope > .iconic-icon');

			// Prepend an icon element if it didn't exist.
			iconEl ??= linkEl.createDiv({ cls: 'iconic-icon', prepend: true });

			// Render/hide tag icon.
			let { id, icon, iconDefault, color, category } = this.iconManager.getIconItem(file.path);
			icon ??= iconDefault;
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
}