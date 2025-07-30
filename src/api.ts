import { EventRef, Events } from 'obsidian';
import { RulePage } from './model/rule';
import { getIconWithColor } from './utils/icon-utils';
import IconicPlugin, { SetIconOption } from './main';
import IconicSettings from './model/settings';
import FileIconManager from './managers/file-icon-manager';

/**
 * Provides Iconic API for third party plugins to get access to the icon
 * database and utilities.
 */
export default class IconicAPI extends Events {
	public readonly plugin: IconicPlugin;
	public readonly settings: IconicSettings;

	private readonly fileIconManager: FileIconManager;

	constructor(plugin: IconicPlugin) {
		super();
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.fileIconManager = plugin.fileIconManager;
		this.load();
	}

	/**
	 * Triggered when all file or folder icons were refreshed.
	 */
	public on(name: 'refresh-all-file-icons', callback: (page: RulePage | 'all') => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when individual file/folder icon was refreshed. It won't be
	 * triggered when all file/folder icons were refreshed.
	 */
	public on(name: 'refresh-file-icon', callback: (filepath: string) => unknown, ctx?: unknown): EventRef;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public on(name: string, callback: (...data: any[]) => unknown, ctx?: unknown): EventRef {
		return super.on(name, callback, ctx);
	}

	/**
	 * Insert corresponding file icon element to the {@link parent}.
	 * 
	 * @param option Configures the icon behavior optionally.
	 * 
	 * - `reuse`?: `boolean`: When the parent has the same icon and color, it
	 *   will not redraw and reuses that old icon.
	 * - `noHandler`?: `boolean`: Decides whether clicking the icon should open
	 *   a menu/icon picker or not.
	 * - `openMenu`?: `boolean`: If true, open a menu providing an option to
	 *   change the icon. Otherwise, will immediately open icon picker instead.
	 * - `rightClick`?: `boolean`: Use right/secondary click instead.
	 * 
	 * Also, you can configure the same option as when you pass it to the
	 * `addEventListener()`.
	 */
	public setFileIcon(
		parent: HTMLElement,
		filepath: string,
		option?: SetIconOption
	): void {
		let iconItem = this.fileIconManager.getIconItem(filepath);
		iconItem.icon ??= iconItem.iconDefault;
		if (iconItem.icon) this.plugin.setIcon(parent, {
			id: filepath,
			category: iconItem.category,
			icon: iconItem.icon,
			color: iconItem.color
		}, option);
	}

	/**
	 * Get corresponding file icon element.
	 */
	public getFileIcon(filepath: string): SVGSVGElement | HTMLElement | null {
		let iconItem = this.fileIconManager.getIconItem(filepath);
		iconItem.icon ??= iconItem.iconDefault;
		if (iconItem.icon) return getIconWithColor(
			iconItem.icon, iconItem.color
		);
		else return null;
	}

	private async load(): Promise<void> {
		await this.plugin.firstResolve;

		// Listen to the rule manager "update" event.
		this.plugin.registerEvent(this.plugin.ruleManager.on('iconic:update', page => {
			this.trigger('refresh-all-file-icons', page);
		}));

		// Listen to the "setting-change" event.
		this.plugin.registerEvent(this.plugin.settingManager.on('settings-change', changed => {
			let { useProperty } = this.settings,
				category: RulePage | 'all' | undefined;

			// Trigger file refresh event when these settings were changed.
			if (
				'showAllFileIcons' in changed ||
				'useProperty' in changed ||
				useProperty && (
					'colorProperty' in changed ||
					'iconProperty' in changed
				)
			) {
				category = 'file';
			}

			// Trigger folder refresh event when this setting was changed.
			if ('showAllFolderIcons' in changed) {
				if (category === 'file') category = 'all';
				else category = 'folder';
			}

			if (category) this.trigger('refresh-all-file-icons', category);
		}));

		// Trigger individual file icon refresh after any of file icon manager
		// events was fired.
		this.plugin.registerEvent(this.plugin.fileIconManager.on('iconic:add', path => {
			this.trigger('refresh-file-icon', path);
		}));
		this.plugin.registerEvent(this.plugin.fileIconManager.on('iconic:change', path => {
			this.trigger('refresh-file-icon', path);
		}));
		this.plugin.registerEvent(this.plugin.fileIconManager.on('iconic:delete', path => {
			this.trigger('refresh-file-icon', path);
		}));
		this.plugin.registerEvent(this.plugin.fileIconManager.on('iconic:refresh', path => {
			this.trigger('refresh-file-icon', path);
		}));

		// Listen to the rule reactive state.
		this.plugin.registerEvent(this.plugin.ruleManager.on('iconic:react', path => {
			this.trigger('refresh-file-icon', path);
		}));
	}
}