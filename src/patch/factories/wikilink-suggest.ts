import { around, ObjectFactory } from 'monkey-around';
import { WikilinkSuggest } from 'obsidian';
import IconicPlugin from '../../main';
import FileSuggestIconProvider from '../../renderers/icon-provider/file-suggest-icon-provider';

const wikilinkSuggestFactory = (plugin: IconicPlugin, suggest: WikilinkSuggest): ObjectFactory<WikilinkSuggest> => ({
	iconProvider: () => new FileSuggestIconProvider(plugin, suggest),
	renderSuggestion: oldFn => function (this: WikilinkSuggest, value, resultEl) {
		oldFn.call(this, value, resultEl);
		if (!this.iconProvider.plugin.settings.showIconsAtSuggest) return;
		this.iconProvider.prependIcon(value, resultEl);
	}
})

export function patchWikilinkSuggest(plugin: IconicPlugin) {
	let suggest = plugin.app.workspace.editorSuggest.suggests[0];
	return around(suggest, wikilinkSuggestFactory(plugin, suggest));
}