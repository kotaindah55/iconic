import { around, ObjectFactory } from 'monkey-around';
import { TagSuggest } from 'obsidian';
import IconicPlugin from '../../main';
import TagSuggestIconProvider from '../../renderers/icon-provider/tag-suggest-icon-provider';

const tagSuggestFactory = (plugin: IconicPlugin, suggest: TagSuggest): ObjectFactory<TagSuggest> => ({
	iconProvider: () => new TagSuggestIconProvider(plugin, suggest),
	renderSuggestion: oldFn => function (this: TagSuggest, value, resultEl) {
		oldFn.call(this, value, resultEl);
		if (!this.iconProvider.plugin.settings.showIconsAtSuggest) return;
		this.iconProvider.prependIcon(value, resultEl);
	}
})

export function patchTagSuggest(plugin: IconicPlugin) {
	let suggest = plugin.app.workspace.editorSuggest.suggests[1];
	return around(suggest, tagSuggestFactory(plugin, suggest));
}