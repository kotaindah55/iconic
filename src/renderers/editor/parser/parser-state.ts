import { TreeCursor } from '@lezer/common';
import { TextCursor } from '../../../@external/obsidian-plugin-helper/src/codemirror';
import { StreamSpec } from './stream-parser';

const SKIPPED_NODE_RE = /table|code|formatting|escape|html|math|tag|url|barelink|atom|comment|string|meta|frontmatter|internal-link|hr(?!\w)/;

/**
 * Store parser state, such as offset, during the parsing.
 */
export default class ParserState {
	public readonly textCursor: TextCursor;
	public readonly treeCursor: TreeCursor;
	public readonly endOfStream: number;

	/**
	 * Tells whether the tree cursor hit the last node.
	 */
	public treeEnd: boolean;
	public finished: boolean;

	/**
	 * Absolute offset position.
	 */
	public gOffset: number;
	/**
	 * Offset which is relative to the current line.
	 */
	public lOffset: number;

	constructor(spec: StreamSpec) {
		this.textCursor = spec.textCursor;
		this.treeCursor = spec.treeCursor;
		this.endOfStream = spec.eos;
		
		this.treeEnd = spec.treeEnd;
		this.finished = false;

		this.gOffset = this.textCursor.curLine.from;
		this.lOffset = 0;
	}

	/**
	 * Tells that the offset hit a node that has to be skipped.
	 */
	public isSkipped(): boolean {
		if (this.treeEnd) return false;
		return SKIPPED_NODE_RE.test(this.treeCursor.type.name);
	}

	/**
	 * Get the current node position compared to the offset.
	 */
	public getNodePos(): 'after' | 'after-touching' | 'before' | 'before-touching' | 'within' {
		let { from, to } = this.treeCursor;
		if (this.gOffset < from) return 'after';
		if (this.gOffset === from) return 'after-touching';
		if (this.gOffset > to) return 'before';
		if (this.gOffset === to) return 'before-touching';
		return 'within';
	}

	/**
	 * Get a character located at the current offset.
	 */
	public getChar(): string {
		return this.textCursor.curLine.text[this.lOffset];
	}
}