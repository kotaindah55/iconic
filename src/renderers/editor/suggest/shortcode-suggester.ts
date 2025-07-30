import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo
} from 'obsidian';
import { isAlphanumeric } from '../../../utils/editor-utils';
import { ICON_MAP, ICONS } from '../../../constants/icons';
import { setEmoji, setIconWithColor } from '../../../utils/icon-utils';
import { DEFAULT_UFUZZY_OPT } from '../../../utils/ufuzzy-utils';
import { ICON_SHORTCODE_DELIM, ICON_SHORTCODE_SEPARATOR } from '../../../constants/shortcode';
import { EMOJIS } from '../../../constants/emojis';
import uFuzzy from '@leeoniya/ufuzzy';
import ColorSuggestion from './color-suggester';
import EMOJI_SHORTCODES from '../../../../data/emoji-shortcodes.mjs';
import IconicPlugin from '../../../main';

interface IconFuzzyResult {
	icon: string;
	range: number[];
	variant: string;
	isHistory?: boolean;
}

export default class ShortCodeSuggester extends EditorSuggest<IconFuzzyResult> {
	private readonly plugin: IconicPlugin;
	private readonly engine: uFuzzy;

	private haystack: string[];
	private mode: 'icon' | 'emoji';
	private iconHistory: IconFuzzyResult[];
	private emojiHistory: IconFuzzyResult[];
	private maxHistory: number;

	public readonly colorSuggester: ColorSuggestion;

	constructor(plugin: IconicPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.engine = new uFuzzy(DEFAULT_UFUZZY_OPT);
		this.colorSuggester = new ColorSuggestion(plugin.app);

		this.limit = 20;
		this.iconHistory = [];
		this.emojiHistory = [];
		this.maxHistory = 7;

		this.setInstructions([{
			command: 'Type |',
			purpose: 'to add color'
		}]);

		this.setMode('emoji');

		this.scope.register(null, '|', evt => {
			if (this.mode === 'emoji') return;

			let idx = this.suggestions.selectedItem,
				selected = this.suggestions.values?.[idx],
				{ editor, file } = this.context ?? {};

			if (!editor || !file || !selected) return;
			this.selectSuggestion(selected, evt, true);
			return false;
		});
	}

	public onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		if (!this.plugin.sortCodeSuggest) return null;

		let line = editor.getLine(cursor.line),
			startPart = line.slice(0, cursor.ch),
			prefix = this.getPrefix(startPart);

		if (!prefix) return null;
		if (prefix.chars[0] === '!') {
			this.setMode('icon');
			prefix.chars = prefix.chars.slice(1);
			prefix.offset++;
		} else {
			this.setMode('emoji');
		}

		return {
			start: { line: cursor.line, ch: prefix.offset },
			end: cursor,
			query: prefix.chars
		};
	}

	public getSuggestions(context: EditorSuggestContext): IconFuzzyResult[] {
		let { mode } = this,
			[, info, order] = this.engine.search(this.haystack, context.query);
		if (!context.query) return mode == 'icon'
			? this.iconHistory
			: this.emojiHistory;

		if (!info || Object.isEmpty(info) || !order) return [];

		let { idx, ranges } = info,
			results: IconFuzzyResult[] = [],
			max = Math.min(order.length, this.limit);

		if (mode === 'icon') for (let i = 0; i < max; i++) {
			let icon = this.haystack[idx[order[i]]],
				variant = ICON_MAP.has(icon) ? 'default' : 'lucide';
			if (i && results[i - 1].icon === icon) variant = 'lucide';
			results.push({ icon, range: ranges[order[i]], variant });
		}

		else for (let i = 0; i < max; i++) {
			let icon = this.haystack[idx[order[i]]];
			results.push({ icon, range: ranges[order[i]], variant: 'emoji' });
		}

		return results;
	}

	public renderSuggestion(value: IconFuzzyResult, itemEl: HTMLElement): void {
		let { icon } = value,
			iconEl = createDiv('suggestion-icon'),
			contentEl = createDiv('suggestion-content'),
			auxEl = createDiv('suggestion-aux'),
			titleEl = contentEl.createDiv('suggestion-title'),
			flairLeftEl = iconEl.createDiv('suggestion-flair iconic-icon'),
			flairRightEl = auxEl.createDiv('suggestion-flair');

		if (value.variant === 'emoji') {
			setEmoji(flairLeftEl, EMOJI_SHORTCODES[icon]);
		} else if (value.variant === 'lucide') {
			setIconWithColor(flairLeftEl, 'lucide-' + icon);
		} else {
			setIconWithColor(flairLeftEl, icon);
		}

		itemEl.addClass('mod-complex');
		titleEl.setText(createFragment(fragment => {
			let { range } = value;
			if (range[0] !== 0) {
				fragment.append(new Text(icon.slice(0, range[0])));
			}
			for (let i = 0; i < range.length; i++) {
				let from = range[i],
					to = range[++i];
				fragment.append(createSpan({
					cls: 'suggestion-highlight',
					text: icon.slice(from, to)
				}));
				if (to < icon.length) fragment.append(new Text(
					icon.slice(to, range[i + 1] ?? icon.length)
				));
			}
		}));

		if (value.isHistory) setIconWithColor(flairRightEl, 'lucide-history', 'var(--text-faint)');
		itemEl.append(iconEl, contentEl, auxEl);
	}
	
	public selectSuggestion(
		value: IconFuzzyResult,
		evt: MouseEvent | KeyboardEvent,
		openColor = false
	): void {
		if (value.variant === 'emoji') {
			this.selectEmojiSuggestion(value);
		} else {
			this.selectIconSuggestion(value, evt, openColor);
		}

		this.addHistory(value.icon, value.variant);
		this.close();
	}

	private selectEmojiSuggestion(value: IconFuzzyResult): void {
		if (!this.context) return;

		let { start, end, editor } = this.context,
			insert = EMOJI_SHORTCODES[value.icon],
			from = editor.posToOffset(start) - 1,
			to = editor.posToOffset(end);

		editor.cm.dispatch({ changes: { from, to, insert }});
		if (!this.context.query) this.context.editor.cm.dispatch({
			sequential: true,
			selection: { anchor: from + insert.length }
		});
	}

	private selectIconSuggestion(
		value: IconFuzzyResult,
		evt: MouseEvent | KeyboardEvent,
		openColor: boolean
	): void {
		if (!this.context) return;

		let closing = openColor ? ICON_SHORTCODE_SEPARATOR : ICON_SHORTCODE_DELIM + ' ',
			insert = value.icon + closing,
			{ start, end, editor, file } = this.context,
			from = editor.posToOffset(start) - 1,
			to = editor.posToOffset(end);

		if (value.variant === 'lucide') insert = 'lucide-' + insert;
		this.context.editor.cm.dispatch({
			changes: { from, to, insert }
		});
		if (!this.context.query) this.context.editor.cm.dispatch({
			sequential: true,
			selection: { anchor: from + insert.length }
		});
		
		if (openColor) evt.win.setTimeout(() => {
			this.colorSuggester.icon = value.variant === 'lucide'
				? 'lucide-' + value.icon
				: value.icon;
			this.app.workspace.editorSuggest.trigger(editor, file, true);
		});
	}

	private setMode(mode: 'emoji' | 'icon'): void {
		if (this.mode == mode) return;

		this.mode = mode;
		if (mode == 'emoji') {
			this.haystack = EMOJIS;
			this.setInstructions([
				{ command: 'Type !', purpose: 'to switch to icon' }
			]);
		} else {
			this.haystack = ICONS;
			this.setInstructions([
				{ command: 'Type |', purpose: 'to add color' }
			]);
		}
	}

	private getPrefix(text: string): { chars: string, offset: number } | null {
		let prefix: { chars: string, offset: number } | null = null;

		for (let i = text.length - 1; i >= 0; i--) {
			let char = text[i];
			if (char === ICON_SHORTCODE_DELIM) {
				if (text[i - 1] !== ICON_SHORTCODE_DELIM) prefix = {
					chars: text.slice(i + 1), offset: i + 1
				};
				break;
			}
			if (char === '!' && text[i - 1] === ICON_SHORTCODE_DELIM) continue;
			if (!isAlphanumeric(char)) break;
		}

		return prefix;
	}

	private addHistory(icon: string, variant: string): void {
		let history = variant === 'emoji'
			? this.emojiHistory
			: this.iconHistory;

		let sameItemIdx = history.findIndex(item => {
			return item.icon === icon && item.variant === variant
		});

		if (sameItemIdx >= 0) {
			if (!sameItemIdx) return;
			let item = history.splice(sameItemIdx, 1)[0];
			history.unshift(item);
			return;
		}

		while (history.length && history.length >= this.maxHistory) history.pop();
		history.unshift({ icon, variant, range: [], isHistory: true });
	}
}