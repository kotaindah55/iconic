import { App, EventRef, Events } from 'obsidian';
import { IconBase } from '../model/icon-item';
import IconicPlugin from '../main';

/**
 * Base class for all icon managers. Not responsible for rendering icons.
 */
export default abstract class IconManager extends Events {
	public readonly app: App;
	public readonly plugin: IconicPlugin;
	public iconMap: Record<string, IconBase>;

	constructor(plugin: IconicPlugin) {
		super();
		this.app = plugin.app;
		this.plugin = plugin;
		this.iconMap = {};
	}

	/**
	 * Can be used to refresh certain icon manually.
	 */
	public on(name: 'iconic:refresh', callback: (id: string) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when added an icon.
	 */
	public on(name: 'iconic:add', callback: (id: string) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when deleted an icon of registered id.
	 */
	public on(name: 'iconic:delete', callback: (id: string) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when changed an icon of registered id.
	 */
	public on(name: 'iconic:change', callback: (id: string) => unknown, ctx?: unknown): EventRef;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public on(name: string, callback: (...data: any[]) => unknown, ctx?: unknown): EventRef {
		return super.on(name, callback, ctx);
	}

	/**
	 * Add an icon of corresponding {@link id}.
	 */
	public addIcon(id: string, icon: string, color?: string): void {
		// Cannot add an icon of the registered id.
		if (this.iconMap[id]) return;

		// Register the id and map its icon to it.
		this.iconMap[id] = { icon, color };
		this.plugin.requestSave();
		this.trigger('iconic:add', id);
	}

	/**
	 * Change an icon of corresponding {@link id}.
	 */
	public changeIcon(id: string, icon: string, color?: string): void {
		// Cannot change an icon of unregistered id.
		if (!this.iconMap[id]) return;

		// Change the icon.
		this.iconMap[id].icon = icon;
		this.iconMap[id].color = color;
		this.plugin.requestSave();
		this.trigger('iconic:change', id);
	}

	/**
	 * Delete an icon of corresponding {@link id}.
	 */
	public deleteIcon(id: string): void {
		// Cannot change an icon of unregistered id.
		if (!this.iconMap[id]) return;

		// Unregister the id and delete its icon.
		delete this.iconMap[id];
		this.plugin.requestSave();
		this.trigger('iconic:delete', id);
	}
}