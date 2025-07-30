import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { Platform } from 'obsidian';
import { handleLongPress } from '../../../@external/obsidian-plugin-helper/dom';
import { setIconWithColor } from '../../../utils/icon-utils';
import { toRgb } from '../../../utils/color-utils';
import ShortCodeToken from '../../../model/shortcode-token';

export default class IconWidget extends WidgetType implements ShortCodeToken {
	public from: number;
	public to: number;
	public hasSeparator: boolean;
	public icon: string;
	public color: string;
	public aborter: AbortController;

	public readonly view: EditorView;
	public readonly startEdit: () => void;

	public count: number;

	constructor(view: EditorView, token: ShortCodeToken) {
		super();
		this.from = token.from;
		this.to = token.to;
		this.hasSeparator = token.hasSeparator;
		this.icon = token.icon;
		this.color = token.color;
		
		this.aborter = new AbortController();
		this.view = view;
		this.startEdit = () => view.dispatch({ selection: {
			anchor: this.from + 1,
			head: this.to - 1
		}});
	}

	public toDOM(): HTMLElement {
		let iconEl = createSpan({ cls: 'iconic-icon iconic-shortcode' });
		setIconWithColor(iconEl, this.icon, this.color);
		this.attachHandler(iconEl);
		return iconEl;
	}

	public attachHandler(iconEl: HTMLElement): void {
		this.aborter.abort();
		this.aborter = new AbortController();
		if (Platform.isMobile) {
			handleLongPress(iconEl, this.startEdit, 800, { signal: this.aborter.signal });
		} else {
			iconEl.addEventListener('dblclick', this.startEdit, { signal: this.aborter.signal })
		}
	}

	public eq(newWidget: IconWidget): boolean {
		let isEq = (
			this.icon === newWidget.icon &&
			this.color === newWidget.color &&
			this.from === newWidget.from &&
			this.to === newWidget.to
		);

		if (!isEq) this.aborter.abort();
		return isEq;
	}

	public updateDOM(iconEl: HTMLElement): boolean {
		this.attachHandler(iconEl);
		let iconSVG = iconEl.find(':scope > svg');
		if (!iconSVG) return false;

		if (
			!iconSVG.hasClass(this.icon) ||
			toRgb(this.color) !== iconSVG.getAttr('stroke')
		) setIconWithColor(iconEl, this.icon, this.color);
		return true;
	}

	public static of(view: EditorView, token: ShortCodeToken): Decoration {
		let widgetDeco = Decoration.replace({
			widget: new IconWidget(view, token)
		});
		widgetDeco.point = true;
		return widgetDeco;
	}
}