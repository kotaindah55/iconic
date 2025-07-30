import { App, Component } from 'obsidian';
import IconicPlugin from '../../main';
import IconManager from '../../managers/icon-manager';

/**
 * Base class for all icon renderers.
 */
export default abstract class IconRenderer extends Component {
	public readonly app: App;
	public readonly plugin: IconicPlugin;
	public abstract readonly iconManager: IconManager;

	protected readonly parent?: Component;

	constructor(plugin: IconicPlugin, parent?: Component) {
		super();
		this.app = plugin.app;
		this.plugin = plugin;
		this.parent = parent;
	}

	/**
	 * Shouldn't override it. Call `super.onload()` first instead.
	 */
	public onload(): void {
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
			this.iconManager.on('iconic:refresh', id => this.renderSingle(id))
		);

		// Unload this component as soon as the plugin was unloaded.
		this.registerEvent(
			this.app.workspace.on('iconic:plugin-unload', () => this.parent?.removeChild(this))
		);
	}

	protected abstract renderSingle(id: string): void;
}