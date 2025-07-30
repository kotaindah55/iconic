import { around, ObjectFactory } from 'monkey-around';
import { MarkdownView } from 'obsidian';

const markdownViewFactory: ObjectFactory<MarkdownView> = {
	setMode: oldFn => async function (this: MarkdownView, mode) {
		let changed = await oldFn.call(this, mode);
		if (changed) this.leaf.trigger('markdown-view:mode-change', this);
		return changed;
	}
}

export function patchMarkdownView() {
	return around(MarkdownView.prototype, markdownViewFactory);
}