import { BaseComponent, IconName, setIcon } from 'obsidian';
import { toRgbObject } from 'src/utils/color-utils';

export default class Callout extends BaseComponent {
	// Base elements.
	public containerEl: HTMLElement;
	public calloutEl: HTMLElement;

	// Title element and its children.
	public titleEl: HTMLElement;
	public innerEl: HTMLElement;
	public iconEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		super();
		this.containerEl = containerEl;
		this.calloutEl = createDiv({ cls: 'callout' });

		this.titleEl = this.calloutEl.createDiv({ cls: 'callout-title' });
		this.innerEl = this.titleEl.createDiv({ cls: 'callout-title-inner' });
		this.iconEl = this.titleEl.createDiv({ cls: 'callout-icon' });

		this.containerEl.append(this.calloutEl);
	}

	public setTitle(content: string | DocumentFragment): this {
		this.titleEl.setText(content);
		return this;
	}

	public setIcon(icon: IconName): this {
		setIcon(this.iconEl, icon);
		return this;
	}

	public setColor(color: string): this {
		toRgbObject(color);
		this.calloutEl.setCssProps({ '--callout-color': color });
		return this;
	}
}