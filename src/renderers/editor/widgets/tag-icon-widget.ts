import { Decoration, WidgetType } from '@codemirror/view';
import { IconName } from 'obsidian';
import { setIconWithColor } from '../../../utils/icon-utils';
import IconicPlugin from '../../../main';

/**
 * Display an icon tag as a widget in the editor.
 */
export default class TagIconWidget extends WidgetType {
	public tag: string;
	public icon: IconName;
	public color?: string;
	public handler: (evt: MouseEvent) => unknown;
	public ts: number;

	constructor(plugin: IconicPlugin, tag: string, icon: IconName, color?: string) {
		super();
		this.tag = tag;
		this.icon = icon;
		this.color = color;
		this.handler = () => {
			if (!plugin.clickableIcon) return;
			plugin.openIconPicker([{ category: 'tag', id: tag }]);
		};
	}

	public toDOM(): HTMLElement {
		let iconEl = createSpan({ cls: ['iconic-icon', 'cm-hashtag-icon', 'cm-hashtag'] });
		setIconWithColor(iconEl, this.icon, this.color);
		iconEl.firstChild?.addEventListener('click', this.handler);
		return iconEl;
	}

	public eq(other: TagIconWidget): boolean {
		return (
			this.tag === other.tag &&
			this.icon === other.icon &&
			this.color === other.color
		);
	}

	public destroy(iconEl: HTMLElement): void {
		iconEl.firstChild?.removeEventListener('click', this.handler);
	}

	public become(iconEl: HTMLElement, old: TagIconWidget): void {
		iconEl.firstChild?.removeEventListener('click', old.handler);
		iconEl.firstChild?.addEventListener('click', this.handler);
	}

	/**
	 * Build a widget decoration with this widget type.
	 */
	public static of(plugin: IconicPlugin, tag: string, icon: IconName, color?: string): Decoration {
		return Decoration.widget({
			widget: new TagIconWidget(plugin, tag, icon, color),
			// Ensure that the widget will become a part of the tag decoration.
			side: 1000
		});
	}
}