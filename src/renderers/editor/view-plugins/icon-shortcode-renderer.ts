import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { EditorSelection, RangeSet, RangeSetBuilder } from '@codemirror/state';
import { editorLivePreviewField } from 'obsidian';
import { ICON_MAP } from '../../../constants/icons';
import { fastFind, isInside, isRegionTouchedByRange, PlainRange } from '../../../@external/obsidian-plugin-helper/global';
import shortCodeState, { ShortCodeFieldValue } from '../parser/shortcode-state';
import IconWidget from '../widgets/icon-widget';

function isSelectionChanged(update: ViewUpdate): boolean {
	let prev = update.startState.selection,
		curr = update.state.selection;
	return !prev.eq(curr);
}

export class IconShortcodePlugin implements PluginValue {
	public readonly view: EditorView;
	public readonly fieldValue: ShortCodeFieldValue;
	public decorations: DecorationSet;

	private lastRenderedValue: string;

	constructor(view: EditorView) {
		this.view = view;
		this.fieldValue = view.state.field(shortCodeState);
		this.build(view.visibleRanges, view.state.selection);
	}

	public update(update: ViewUpdate): void {
		if (!update.state.field(editorLivePreviewField)) {
			this.decorations = RangeSet.empty;
			this.lastRenderedValue = '';
		} else if (isSelectionChanged(update) || update.viewportChanged || this.isValueChanged()) {
			this.build(update.view.visibleRanges, update.state.selection);
		}
	}

	private build(ranges: readonly PlainRange[] | PlainRange[], selection: EditorSelection): void {
		let { tokens, hash } = this.fieldValue,
			mainSelection = selection.main,
			startIdx = fastFind(tokens, ranges[0]?.from ?? 0)?.index,
			endBoundary = ranges.at(-1)?.to ?? 0,
			builder = new RangeSetBuilder<Decoration>();

		this.lastRenderedValue = hash;

		if (startIdx !== undefined) for (let i = startIdx; i < tokens.length; i++) {
			let token = tokens[i];
			if (token.from >= endBoundary) break;
			if (!ICON_MAP.has(token.icon) || isInside(mainSelection, token)) continue;
			if (isRegionTouchedByRange(token, ranges)) {
				builder.add(token.from, token.to, IconWidget.of(this.view, token));
			}
		}

		this.decorations = builder.finish();
	}

	private isValueChanged(): boolean {
		return this.lastRenderedValue !== this.fieldValue.hash;
	}
}

const iconShortcodeRenderer = ViewPlugin.fromClass(IconShortcodePlugin, {
	decorations: value => value.decorations
});

export default iconShortcodeRenderer;