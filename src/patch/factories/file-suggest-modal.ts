import { around, ObjectFactory } from 'monkey-around';
import { FileSuggestModal } from 'obsidian';
import IconicPlugin from '../../main';
import FileSuggestIconProvider from '../../renderers/icon-provider/file-suggest-icon-provider';

const fileSuggestModalFactory = (plugin: IconicPlugin): ObjectFactory<FileSuggestModal> => ({
	open: oldFn => function (this: FileSuggestModal) {
		this.iconProvider = new FileSuggestIconProvider(plugin, this);
		this.renderSuggestion = (suggestion, resultEl) => {
			let oldFn = (Object.getPrototypeOf(this) as FileSuggestModal).renderSuggestion;
			oldFn.call(this, suggestion, resultEl);
			if (!this.iconProvider.plugin.settings.showIconsAtSuggest) return;
			this.iconProvider.prependIcon(suggestion, resultEl);
		};
		oldFn.call(this);
	}
})

export function patchFileSuggestModal(plugin: IconicPlugin) {
	let quickSwitcherPlugin = plugin.app.internalPlugins.getPluginById('switcher').instance,
		quickSwitcherModalConstructor = quickSwitcherPlugin.QuickSwitcherModal,
		fileSuggestProto = Object.getPrototypeOf(quickSwitcherModalConstructor.prototype) as FileSuggestModal;
	
	return around(fileSuggestProto, fileSuggestModalFactory(plugin));
}