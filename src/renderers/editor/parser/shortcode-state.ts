import {
	Language,
	lineClassNodeProp,
	syntaxTree,
	syntaxTreeAvailable
} from '@codemirror/language';
import { ChangeDesc, EditorState, StateField, Text, Transaction } from '@codemirror/state';
import { SyntaxNode, Tree, TreeCursor } from '@lezer/common';
import { ChangedRange, mergeChanges, TextCursor } from '../../../@external/obsidian-plugin-helper/codemirror';
import { fastFind } from '../../../@external/obsidian-plugin-helper/global';
import StreamParser, { StreamSpec } from './stream-parser';
import StateStore from './store';
import ShortCodeToken from '../../../model/shortcode-token';

export interface ShortCodeFieldValue {
	parser: StreamParser;
	tokens: ShortCodeToken[];
	store: StateStore;
	hash: string;
}

const INTERFENCE_RE = /(?:codeblock|html|math)-(?:begin|end)|comment-(?:start|end)|cdata|tag$/;

/**
 * Ensure most updated tree that's available up to the length,
 * predetermined by the language context.
 * @returns Null if doesn't reach the length.
 */
function ensureMostUpdatedTree(tr: Transaction): Tree | null {
	let langStateField = Language.state,
		langStateFxType = Language.setState,
		{ state } = tr,
		{ tree, treeLen } = state.field(langStateField).context;

	// Sometimes, in the huge document, language state effect was passed to
	// the transaction.
	tr.effects.forEach(effect => {
		if (effect.is(langStateFxType)) {
			tree = effect.value.context.tree;
			treeLen = effect.value.context.treeLen;
		}
	});

	return syntaxTreeAvailable(state, treeLen)
		? tree
		: null;
}

/**
 * State field specification for the {@link shortCodeState}, implementing
 * simple-incremental parsing.
 */
class ShortCodeField {
	public create = (state: EditorState): ShortCodeFieldValue => {
		let tree = syntaxTree(state),
			treeCursor = tree.cursor(),
			treeEnd = false,
			parser = new StreamParser(),
			store = new StateStore(),
			hash = Date.now().toString(36);

		treeCursor.next();
		if (treeCursor.name === 'Document') treeEnd = true;

		store.oldTree = tree;
		parser.init({
			textCursor: TextCursor.atOffset(state.doc, 0),
			treeCursor, treeEnd,
			bos: 0, eos: tree.length,
			changedRange: null
		});
		parser.stream();
		return { parser, tokens: parser.take(), store, hash };
	}

	public update = (
		value: ShortCodeFieldValue,
		tr: Transaction
	): ShortCodeFieldValue => {
		let { parser, tokens, store } = value,
			tree = ensureMostUpdatedTree(tr),
			changeDesc = tr.changes;

		// Only update when the tree was available at the time.
		if (tr.docChanged) store.storeChanges(changeDesc);

		if (tree && store.hasChanges()) {
			let spec = this.getStreamSpec(
				tr.newDoc,
				tree, store.oldTree,
				store.takeChanges()
			);

			store.oldTree = tree;
			parser.init(spec);
			parser.stream();
			value.tokens = this.updateTokens(tokens, parser.take(), spec);
			value.hash = Date.now().toString(36);
		}

		return value;
	}

	/**
	 * Filter the old tokens and update it with the new one, based on the
	 * given stream spec.
	 * @param tokens Old tokens.
	 * @returns New tokens.
	 */
	private updateTokens(
		tokens: ShortCodeToken[],
		newTokens: ShortCodeToken[],
		{ bos, eos, changedRange }: StreamSpec
	): ShortCodeToken[] {
		let startIdx = fastFind(tokens, bos)?.index ?? tokens.length,
			toBeFiltered = tokens.splice(startIdx);
		tokens = tokens.concat(newTokens);

		// Subsequent tokens can only be exist after document change.
		if (!changedRange) return tokens;
		
		// Discard tokens that are no longer used.
		let endIdx = 0;
		for (; endIdx < toBeFiltered.length; endIdx++) {
			let token = toBeFiltered[endIdx];
			if (token.from > eos - changedRange.length) break;
		}

		// Shift subsequent tokens by the change amount.
		let toBeShifted = toBeFiltered.slice(endIdx),
			threshold = changedRange.length;
		for (let i = 0; i < toBeShifted.length; i++) {
			let token = toBeShifted[i];
			token.from += threshold;
			token.to += threshold;
		}
		return tokens.concat(toBeShifted);
	}

	/**
	 * Produces stream spec that can be used as parser state.
	 */
	private getStreamSpec(
		doc: Text,
		currTree: Tree,
		prevTree: Tree,
		changeDesc: ChangeDesc | null,
	): StreamSpec {
		let changedRange = changeDesc ? mergeChanges(changeDesc) : null,
			bos = Math.min(currTree.length, prevTree.length), // Begin of stream
			eos = Math.max(currTree.length, prevTree.length), // End of stream
			interfered = false, // If true, it forces the parser to run up to the tree length.
			treeEnd = false;

		if (changedRange) {
			bos = Math.min(bos, changedRange.from);
			eos = Math.min(eos, changedRange.toB);
			// Check for any interfence node.
			interfered = this.isInterfered(currTree, prevTree, changedRange);
		}

		let treeCursor: TreeCursor | undefined,
			textCursor: TextCursor;

		// Checking for possible node that may shift the bos backwards.
		let shifterDesc = this.findShifter(currTree, prevTree, bos);
		if (shifterDesc) bos = shifterDesc.shiftedOffset;

		textCursor = TextCursor.atOffset(doc, bos);
		bos = textCursor.curLine.from;

		if (interfered) eos = currTree.length;
		else if (changedRange) eos = textCursor.getLineAt(eos).to;

		if (!treeCursor) {
			treeCursor = currTree.cursorAt(bos, 1);
			if (treeCursor.name === 'Document') treeCursor.next();
			if (treeCursor.name === 'Document') treeEnd = true;
		}

		return { bos, eos, treeEnd, treeCursor, textCursor, changedRange };
	}

	/**
	 * Find any available node at the given offset that may shift it backwards.
	 */
	private findShifter(currTree: Tree, prevTree: Tree, offset: number): {
		shifter: SyntaxNode;
		shiftedOffset: number;
	} | null {
		let from = offset,
			to = offset,
			shiftedOffset: number | undefined,
			shifter: SyntaxNode | undefined;

		currTree.iterate({ from, to, enter({ node }) {
			let lineClass = node.type.prop(lineClassNodeProp);
			if (lineClass) {
				if (lineClass.includes('HyperMD-table-row-1')) {
					shifter = node.prevSibling!;
					shiftedOffset = shifter.from;
				}
				return false;
			}
		}});

		if (!shifter) prevTree.iterate({ from, to, enter({ node }) {
			let lineClass = node.type.prop(lineClassNodeProp);
			if (lineClass) {
				if (lineClass.includes('HyperMD-table-row-1')) {
					shifter = node.prevSibling!;
					shiftedOffset = shifter.from;
				}
				return false;
			}
		}});

		if (shifter && shiftedOffset !== undefined) return {
			shifter, shiftedOffset
		}
		else return null;
	}

	private isInterfered(
		currTree: Tree,
		prevTree: Tree,
		changedRange: ChangedRange
	): boolean {
		let { from, toA, toB } = changedRange,
			found = false;

		currTree.iterate({ from, to: toB, enter({ node }) {
			found = INTERFENCE_RE.test(node.name);
			return !found;
		}});

		if (!found) prevTree.iterate({ from, to: toA, enter({ node }) {
			found = INTERFENCE_RE.test(node.name);
			return !found;
		}});

		return found;
	}
}

const shortCodeState = StateField.define(new ShortCodeField());

export default shortCodeState;