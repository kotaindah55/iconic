import { MarkdownView } from 'obsidian';
import FileIconManager from '../../managers/file-icon-manager';
import IconRenderer from './icon-renderer';
import IconicPlugin from '../../main';

export default class NoteTitleIconRenderer extends IconRenderer {
	public readonly iconManager: FileIconManager;
	public readonly view: MarkdownView;

	constructor(plugin: IconicPlugin, view: MarkdownView) {
		super(plugin, view);
		this.view = view;
		this.iconManager = plugin.fileIconManager;

		// Will automatically unload this renderer when the note was
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

	public onload(): void {
		super.onload();

		let renderCallback = () => {
			if (this.view.file) this.renderSingle();
		};

		// Wrap the inline title element.
		this.view.inlineTitleWrapperEl = createDiv({ cls: 'inline-title-wrapper' });
		this.wrapTitle();

		// Create title icon element.
		this.view.iconTitleEl = this.view.inlineTitleWrapperEl.createDiv({ cls: 'iconic-icon', prepend: true });
		renderCallback();

		// React to the rule manager events.
		this.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			if (page === 'file') renderCallback();
		}));
		this.registerEvent(
			this.plugin.ruleManager.on('iconic:react', id => this.renderSingle())
		);

		// Change the icon when user open another file in the same leaf.
		this.registerEvent(this.view.leaf.on('history-change', () => {
			this.view.iconTitleEl.empty();
			renderCallback();
		}));

		// Rewrap inline title on mode change.
		this.registerEvent(this.view.leaf.on('markdown-view:mode-change', () => {
			this.wrapTitle();
		}));

		// Rerender the icon when one of these settings was changed.
		this.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			if ('useProperty' in changed || 'showAllFileIcons' in changed)
				this.renderSingle();
		}));
	}

	public override onunload(): void {
		// Remove all icons manually when the view is still loaded.
		if (!this.view._loaded) return;

		this.view.inlineTitleWrapperEl.before(this.view.inlineTitleEl);
		this.view.inlineTitleWrapperEl.detach();
		Reflect.deleteProperty(this.view, 'inlineTitleWrapperEl');
		Reflect.deleteProperty(this.view, 'titleIconEl');
	}

	/**
	 * (Re)render this note title icon.
	 */
	protected renderSingle(): void {
		if (!this.view.file) return;

		let id = this.view.file.path,
			iconEl = this.view.iconTitleEl,
			{ icon, iconDefault, category, color } = this.iconManager.getIconItem(id);
		
		icon ??= iconDefault;
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
	 * Wrap inline title element.
	 */
	private wrapTitle(): void {
		this.view.inlineTitleEl.before(this.view.inlineTitleWrapperEl);
		this.view.inlineTitleWrapperEl.append(this.view.inlineTitleEl);
	}
}