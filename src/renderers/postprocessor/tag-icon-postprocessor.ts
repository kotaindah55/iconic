import { App, MarkdownRenderChild, Menu } from 'obsidian';
import IconicPlugin from '../../main';
import TagIconManager from '../../managers/tag-icon-manager';

/**
 * Responsible for rendering tag icons in the reading-mode notes.
 */
export default class TagIconPostProcessor extends MarkdownRenderChild {
	public readonly app: App;
	public readonly plugin: IconicPlugin;
	public readonly iconManager: TagIconManager;

	constructor(containerEl: HTMLElement, plugin: IconicPlugin) {
		super(containerEl);
		this.app = plugin.app;
		this.plugin = plugin;
		this.iconManager = plugin.tagIconManager;
	}

	public override onload(): void {
		this.prependIcons();

		// Call when user added, changed, or deleted an icon.
		this.registerEvent(
			this.iconManager.on('iconic:add', id => this.renderSingle(id))
		);
		this.registerEvent(
			this.iconManager.on('iconic:change', id => this.renderSingle(id))
		);
		this.registerEvent(
			this.iconManager.on('iconic:delete', id => this.renderSingle(id))
		);

		this.registerEvent(
			this.app.workspace.on('iconic:plugin-unload', () => this.unload())
		);
	}

	public override onunload(): void {
		this.detachIcons();
	}

	/**
	 * (Re)render icon for a single tag.
	 * 
	 * @param id Tag name, prefixed with hash (`#`).
	 */
	private renderSingle(id: string): void {
		let iconItem = this.iconManager.getIconItem(id),
			{ icon, category, color } = iconItem,
			tagEls = this.containerEl.querySelectorAll<HTMLAnchorElement>(
				`a.tag[href="${id}"]`
			);

		// Detach all icons if corresponding tag isn't registered.
		if (!icon) {
			tagEls.forEach(tagEl => tagEl.querySelector('.iconic-icon')?.detach());
			return;
		}

		tagEls.forEach(tagEl => {
			let iconEl = tagEl.querySelector<HTMLElement>('.iconic-icon');
			if (!iconEl) {
				iconEl = createDiv({ cls: 'iconic-icon' });
				tagEl.prepend(iconEl);
			}
			this.plugin.setIcon(iconEl, { id, category, icon, color });
		});
	}

	/**
	 * Prepend icons to the registered tags.
	 */
	private prependIcons(): void {
		let tagEls = this.containerEl.querySelectorAll<HTMLAnchorElement>('a.tag');
		tagEls.forEach(tagEl => {
			let tagName = tagEl.innerText,
				iconItem = this.iconManager.getIconItem(tagName),
				{ id, icon, color, category } = iconItem;

			this.registerDomEvent(tagEl, 'contextmenu', evt => {
				if (!this.plugin.actionMenu) return;
				this.plugin.extendMenu(Menu.forEvent(evt), [{ id, category }]);
				evt.preventDefault();
			});
			
			if (!icon) return;

			// Start prepending the icon element to the tag element.
			let iconEl = createDiv({ cls: 'iconic-icon' });
			tagEl.prepend(iconEl);
			this.plugin.setIcon(iconEl, { id, category, icon, color });
		});
	}

	/**
	 * Detach icons from the registered tags.
	 */
	private detachIcons(): void {
		let iconEls = this.containerEl.querySelectorAll('a.tag>.iconic-icon');
		iconEls.forEach(iconEl => iconEl.detach());
	}
}