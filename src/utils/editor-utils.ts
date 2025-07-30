import { EditorState } from '@codemirror/state';
import { PlainRange } from '../@external/obsidian-plugin-helper/global';
import { EditorTagIconPlugin } from '../renderers/editor/view-plugins/editor-tag-icon-renderer';

/**
 * Get all tags that are touched any of the current {@link ranges}.
 * @param state Target editor state.
 * @param ranges Use editor selection as default.
 */
export function getTagsByRanges(
	state: EditorState,
	ranges: PlainRange[] | readonly PlainRange[] = state.selection.ranges
): string[] {
	let tags: string[] = [];
	// Begins to iterate.
	EditorTagIconPlugin.iterTags(state, (_, tag) => tags.push(tag), ranges);
	return tags;
}

/**
 * Check whether the given character is alphanumeric, with the addition of
 * dash and underscore.
 * 
 * @param char Should be a string with one length.
 */
export function isAlphanumeric(char: string): boolean {
	let charCode = char.charCodeAt(0);
	return (
		charCode === 0x2D || // Dash
		charCode === 0x5F || // Underscore
		charCode >= 0x30 && charCode <= 0x39 || // 0-9
		charCode >= 0x41 && charCode <= 0x5A || // A-Z
		charCode >= 0x61 && charCode <= 0x7A // a-z
	);
}