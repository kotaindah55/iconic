import { lineClassNodeProp } from '@codemirror/language';
import { TreeCursor } from '@lezer/common';
import { ChangedRange, TextCursor } from '../../../@external/obsidian-plugin-helper/src/codemirror';
import { isAlphanumeric } from '../../../utils/editor-utils';
import { ICON_SHORTCODE_DELIM, ICON_SHORTCODE_SEPARATOR } from '../../../constants/shortcode';
import ParserState from './parser-state';
import ShortCodeToken from '../../../model/shortcode-token';

export interface StreamSpec {
	/**
	 * Begin of stream.
	 */
	bos: number;
	/**
	 * End of stream.
	 */
	eos: number;
	treeEnd: boolean;
	treeCursor: TreeCursor;
	textCursor: TextCursor;
	changedRange: ChangedRange | null;
}

/**
 * Responsible for parsing icon shortcodes.
 */
export default class StreamParser {
	public state: ParserState;
	public tokens: ShortCodeToken[];

	constructor() {}

	/**
	 * Create a new state from the given spec before starting the stream.
	 */
	public init(spec: StreamSpec): void {
		this.state = new ParserState(spec);
		this.tokens = [];
	}

	/**
	 * Clear the attached state and take the tokens as a result.
	 */
	public take(): ShortCodeToken[] {
		let result = this.tokens;
		(this.state as unknown) = null;
		(this.tokens as unknown) = null;
		return result;
	}

	/**
	 * Run the stream by eating and reading the strings forwardly until
	 * reaches the end offset of the stream.
	 */
	public stream(): void {
		while (this.state.gOffset < this.state.endOfStream) {
			this.walkTree();
			this.eat();
		}

		this.state.finished = true;
	}

	/**
	 * Advance the offset along with reading subsequent characters.
	 */
	private eat(): void {
		let { treeCursor, textCursor } = this.state;

		// Advance to the next line, once the offset reaches the end of the line.
		if (textCursor.curLine.to === this.state.gOffset) {
			this.nextLine();
		}

		// Move the tree cursor forward if the current node is a line-based node.
		if (
			this.state.getNodePos() !== 'after' &&
			treeCursor.type.prop(lineClassNodeProp) &&
			!this.state.isSkipped()
		) {
			treeCursor.next();
		}
		
		// Try skipping certain node types.
		if (this.state.getNodePos() !== 'after') while (this.state.isSkipped()) {
			this.state.gOffset = treeCursor.to;
			this.state.lOffset = this.state.gOffset - textCursor.curLine.from;

			let hitEnd = false;
			if (treeCursor.type.prop(lineClassNodeProp)) {
				hitEnd = !(treeCursor.nextSibling() || treeCursor.next());
			} else {
				hitEnd = !treeCursor.next();
			}

			// Cursor hits the end of the tree.
			if (treeCursor.name === 'Document' || hitEnd) {
				this.state.treeEnd = true;
				break;
			} else if (this.state.getNodePos() === 'after') {
				break;
			}
		}

		// Reading only occurs when the offset doesn't hit the eos/eol.
		if (this.state.gOffset >= this.state.endOfStream) return;
		if (textCursor.curLine.to === this.state.gOffset) {
			this.nextLine();
		} else {
			// Start reading the characters. 
			let readLen = this.read();
			this.state.gOffset += readLen;
			this.state.lOffset += readLen;
		}
	}

	/**
	 * Read subsequent characters and return the length of what have been
	 * read.
	 */
	private read(): number {
		let char = this.state.getChar();

		// Immediately short-circuit the reading once didn't meet with the
		// delimiter.
		if (char !== ICON_SHORTCODE_DELIM) return 1;

		let { text } = this.state.textCursor.curLine,
			from = this.state.lOffset,
			to = this.state.lOffset + 1,
			separator: number | null = null,
			valid = false;

		// The valid syntax is surrounded by single colon without any whitespace
		// inside, optionally it may have a single bar separating the icon id and
		// its color.
		for (;to < text.length; to++) {
			char = text[to];
			if (char === ICON_SHORTCODE_SEPARATOR) {
				if (!separator) separator = to;
				else break;
			} else if (char === ICON_SHORTCODE_DELIM) {
				if (to - from > 1) valid = true;
				to++;
				break;
			} else if (!isAlphanumeric(char) && (!separator || char !== '#')) {
				break;
			}
		}

		// Tokenize when valid.
		if (valid) this.tokenize(from, to, separator);

		return to - from;
	}

	/**
	 * Advance to the next line(s).
	 */
	private nextLine(): void {
		this.state.textCursor.next();
		this.state.lOffset = 0;

		let { curLine } = this.state.textCursor;

		// Skip blank lines.
		while (
			curLine.to < this.state.endOfStream &&
			!curLine.text.trimEnd()
		) {
			this.state.textCursor.next();
			curLine = this.state.textCursor.curLine;
		}

		this.state.gOffset = curLine.from;
	}

	/**
	 * Move the tree cursor forword until reaches the offset.
	 */
	private walkTree(): void {
		if (this.state.treeEnd === true) return;
		let nodePos = this.state.getNodePos();
		while (nodePos === 'before' || nodePos === 'before-touching') {
			this.state.treeCursor.next();
			nodePos = this.state.getNodePos();
			if (this.state.treeCursor.name === 'Document') {
				this.state.treeEnd = true;
				break;
			}
		}
	}

	/**
	 * Create a token and push it to the {@link tokens | token group}.
	 * 
	 * @param from Local start offset.
	 * @param to Local end offset.
	 * @param separator Local separator offset if any.
	 */
	private tokenize(from: number, to: number, separator: number | null): void {
		let { text } = this.state.textCursor.curLine,
			hasSeparator = !!separator,
			icon = text.slice(from + 1, separator ?? to - 1),
			color = text.slice((separator && separator + 1) ?? to - 1, to - 1);

		// Make them absolute.
		let startingOffset = this.state.textCursor.curLine.from;
		from += startingOffset;
		to += startingOffset;
		this.tokens.push({ from, to, icon, color, hasSeparator });
	}
}