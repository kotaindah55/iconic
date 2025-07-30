import { MarkdownPostProcessorContext, MarkdownRenderChild } from 'obsidian';
import { ICON_MAP } from '../../constants/icons';
import { setIconWithColor } from '../../utils/icon-utils';

const SHORTCODE_RE = /:([a-z0-9_-]+)(\|[#a-z0-9_-]*)?:/gdi;
const SELECTOR_QUERY = 'p, h1, h2, h3, h4, h5, h6, td, th, li:not(:has(p)), .callout-title-inner';
const SKIPPED_CLASSES = [
	'tag',
	'internal-link',
	'external-link',
	'math',
	'internal-embed',
	'list-bullet',
	'collapse-indicator'
];

function isLeafBlock(el: HTMLElement): boolean {
	return (
		el instanceof HTMLParagraphElement ||
		el instanceof HTMLHeadingElement
	);
}

function isTableCellWrapper(el: HTMLElement): boolean {
	return el.hasClass('table-cell-wrapper');
}

function isCallout(el: HTMLElement): boolean {
	return el.hasClass('callout');
}

export default class ShortCodePostProcessor extends MarkdownRenderChild {
	private readonly doc: Document;
	private readonly ctx: MarkdownPostProcessorContext;

	constructor(containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
		super(containerEl);
		this.doc = containerEl.doc;
		this.ctx = ctx;
	}

	public override onload(): void {
		this.process();
	}

	private process(): void {
		let isWholeDoc = this.containerEl == this.ctx.containerEl,
			isDefaultExported = this.containerEl.parentElement?.hasClass('print') ?? false,
			capsulated = !isWholeDoc || isDefaultExported,
			sectionEls: HTMLElement[] = [];

		if (isWholeDoc) sectionEls = this.containerEl.findAll(capsulated
			? ':scope > div'
			: ':scope > *'
		);
		else sectionEls.push(this.containerEl);

		sectionEls.forEach(el => {
			if (!this.isTargeted(el)) return;
			this.walkAndParse(el, capsulated);
		});
	}

	private isTargeted(sectionEl: HTMLElement, capsulated = true): boolean {
		let contentEl = capsulated ? sectionEl.firstElementChild as HTMLElement : sectionEl;
		return (isTableCellWrapper(sectionEl) || contentEl && (
			isLeafBlock(contentEl) ||
			isCallout(contentEl) ||
			contentEl instanceof HTMLTableElement ||
			contentEl instanceof HTMLUListElement ||
			contentEl instanceof HTMLOListElement ||
			contentEl.tagName == 'BLOCKQUOTE'
		));
	}

	private isSkipped(el: HTMLElement): boolean {
		let { tagName } = el;
		if (tagName === 'CODE' || tagName === 'IMG') return true;
		return SKIPPED_CLASSES.some(cls => el.hasClass(cls));
	}

	private walkAndParse(sectionEl: HTMLElement, capsulated: boolean): void {
		let tobeWalked: HTMLElement[];

		if (isTableCellWrapper(sectionEl) || !capsulated && isLeafBlock(sectionEl)) {
			tobeWalked = [sectionEl];
		} else {
			tobeWalked = sectionEl.findAll(SELECTOR_QUERY);
		}

		for (let i = 0; i < tobeWalked.length; i++) {
			let parent = tobeWalked[i],
				children = parent.childNodes;
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				if (child instanceof Text) {
					this.parseText(child);
				} else if (child instanceof HTMLElement && !this.isSkipped(child)) {
					tobeWalked.push(child);
				}
			}
		}
	}

	private parseText(textNode: Text): void {
		let text = textNode.textContent ?? '',
			matches = [...text.matchAll(SHORTCODE_RE)];

		for (let i = matches.length - 1; i >= 0; i--) {
			let match = matches[i],
				range = this.doc.createRange(),
				iconEl = createSpan('iconic-icon iconic-shortcode');

			let from = match.index,
				to = match.index + match[0].length,
				icon = match[1],
				color = match[2]?.slice(1) ?? '';

			if (!ICON_MAP.has(icon)) continue;

			range.setStart(textNode, from);
			range.setEnd(textNode, to);
			range.surroundContents(iconEl);
			setIconWithColor(iconEl, icon, color);
		}
	}
}