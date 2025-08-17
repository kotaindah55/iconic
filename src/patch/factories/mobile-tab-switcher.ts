import { around, ObjectFactory } from 'monkey-around';
import { MobileTabSwitcher } from 'obsidian';
import IconicPlugin from '../../main';

const mobileTabSwitcherFactory = (plugin: IconicPlugin): ObjectFactory<MobileTabSwitcher> => ({
	render: oldFn => function (this: MobileTabSwitcher) {
		oldFn.call(this);
		plugin.app.workspace.iterateRootLeaves(leaf => {
			let iconEl = this.tabPreviewLookup.get(leaf)?.placeholderEl;
			if (!iconEl) return;

			let iconItem = plugin.leafIconManager.getLeafIcon(leaf);
			plugin.setIcon(iconEl, iconItem, {
				noHandler: true,
				openMenu: false,
				reuse: true
			});
		});
	}
})

export function patchTabSwitcher(plugin: IconicPlugin) {
	if (!plugin.app.mobileTabSwitcher) return () => undefined;
	return around(plugin.app.mobileTabSwitcher, mobileTabSwitcherFactory(plugin));
}