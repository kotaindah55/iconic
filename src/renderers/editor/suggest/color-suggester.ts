import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo
} from 'obsidian';
import { DEFAULT_COLORS } from '../../../constants/colors';
import { isAlphanumeric } from '../../../utils/editor-utils';
import { DEFAULT_UFUZZY_OPT } from '../../../utils/ufuzzy-utils';
import { ICON_SHORTCODE_DELIM, ICON_SHORTCODE_SEPARATOR } from '../../../constants/shortcode';
import { setIconWithColor } from '../../../utils/icon-utils';
import uFuzzy from '@leeoniya/ufuzzy';

interface ColorFuzzyResult {
	color: string;
	range: number[];
	isHistory?: boolean;
	fromQuery?: boolean;
}

export default class ColorSuggestion extends EditorSuggest<ColorFuzzyResult> {
	private readonly engine: uFuzzy;
	private readonly defaultColors: string[];

	private history: ColorFuzzyResult[];
	private maxHistory: number;
	
	public icon: string;

	constructor(app: App) {
		super(app);
		this.engine = new uFuzzy(DEFAULT_UFUZZY_OPT);
		this.defaultColors = [...DEFAULT_COLORS.keys()];
		this.history = [];
		this.maxHistory = 7;
	}

	public onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		if (!this.icon) return null;

		let line = editor.getLine(cursor.line),
			startPart = line.slice(0, cursor.ch),
			piece = this.getPiece(startPart);

		if (!piece) return null;

		return {
			start: { line: cursor.line, ch: piece.offset },
			end: cursor,
			query: piece.chars
		};
	}

	public getSuggestions(context: EditorSuggestContext): ColorFuzzyResult[] {
		if (!context.query) return this.getDefaultSuggestions();
		
		let haystack = this.getHaystack(),
			[, info, order] = this.engine.search(haystack, context.query);

		let results: ColorFuzzyResult[] = [{
			color: context.query,
			range: [0, context.query.length],
			fromQuery: true
		}];
		if (!info || Object.isEmpty(info) || !order) return results;

		let { idx, ranges } = info,
			max = Math.min(order.length, this.limit);

		for (let i = 0; i < max; i++) {
			let color = haystack[idx[order[i]]];
			if (color === results[0].color) continue;
			results.push({ color, range: ranges[order[i]] });
		}

		return results;
	}

	public renderSuggestion(value: ColorFuzzyResult, itemEl: HTMLElement): void {
		let { color } = value,
			iconEl = createDiv('suggestion-icon'),
			contentEl = createDiv('suggestion-content'),
			auxEl = createDiv('suggestion-aux'),
			titleEl = contentEl.createDiv('suggestion-title'),
			flairLeftEl = iconEl.createDiv('suggestion-flair iconic-icon'),
			flairRightEl = auxEl.createDiv('suggestion-flair');
		
		setIconWithColor(flairLeftEl, this.icon, color);
		itemEl.addClass('mod-complex');

		titleEl.setText(createFragment(fragment => {
			let { range } = value;
			if (range[0] !== 0) {
				fragment.append(new Text(color.slice(0, range[0])));
			}
			for (let i = 0; i < range.length; i++) {
				let from = range[i],
					to = range[++i];
				fragment.append(createSpan({
					cls: 'suggestion-highlight',
					text: color.slice(from, to)
				}));
				if (to < color.length) fragment.append(new Text(
					color.slice(to, range[i + 1] ?? color.length)
				));
			}
		}));

		if (value.fromQuery) setIconWithColor(
			flairRightEl,
			'lucide-pencil',
			'var(--text-faint)'
		);
		else if (value.isHistory) setIconWithColor(
			flairRightEl,
			'lucide-history',
			'var(--text-faint)'
		);

		itemEl.append(iconEl, contentEl, auxEl);
	}

	public selectSuggestion(value: ColorFuzzyResult, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;

		let insert = value.color + ICON_SHORTCODE_DELIM + ' ',
			{ start, end, editor } = this.context,
			from = editor.posToOffset(start),
			to = editor.posToOffset(end);

		this.context.editor.cm.dispatch({
			changes: { from, to, insert }
		});
		if (!this.context.query) this.context.editor.cm.dispatch({
			sequential: true,
			selection: { anchor: from + insert.length }
		});
		this.addHistory(value.color);
		this.close();
	}

	public close(): void {
		super.close();
		this.icon = '';
	}

	private getHaystack(): string[] {
		return this.history
			.map(item => item.color)
			.filter(color => !this.defaultColors.includes(color))
			.concat(this.defaultColors);
	}

	private getDefaultSuggestions(): ColorFuzzyResult[] {
		let defaultSuggestions = this.defaultColors
			.filter(color => !this.history.some(item => item.color === color))
			.map(color => ({ color, range: [] }));
		return this.history.concat(defaultSuggestions);
	}

	private getPiece(text: string): { chars: string, offset: number } | null {
		let piece: { chars: string, offset: number } | null = null;

		for (let i = text.length - 1; i >= 0; i--) {
			let char = text[i];
			if (char === ICON_SHORTCODE_SEPARATOR) {
				if (text[i - 1] !== ICON_SHORTCODE_SEPARATOR) piece = {
					chars: text.slice(i + 1), offset: i + 1
				};
				break;
			}
			if (!isAlphanumeric(char) && char !== '#') break;
		}

		return piece;
	}

	private addHistory(color: string): void {
		let sameItemIdx = this.history.findIndex(
			item => item.color === color
		);

		if (sameItemIdx >= 0) {
			if (!sameItemIdx) return;
			let item = this.history.splice(sameItemIdx, 1)[0];
			this.history.unshift(item);
			return;
		}

		if (this.history.length === this.maxHistory) this.history.pop();
		this.history.unshift({ color, range: [], isHistory: true });
	}
}