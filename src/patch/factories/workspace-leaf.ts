import { around, ObjectFactory } from 'monkey-around';
import { Menu, WorkspaceLeaf } from 'obsidian';
import { getFilepathFromLeaf } from '../../@external/obsidian-plugin-helper/obsidian';
import { ItemDesc } from '../../dialogs/icon-picker';
import IconicPlugin from '../../main';

const workspaceLeafFactory = (plugin: IconicPlugin): ObjectFactory<WorkspaceLeaf> => ({
	updateHeader: oldFn => function (this: WorkspaceLeaf) {
		oldFn.call(this);
		if (!this.workspace.iconRenderer) return;
		let { iconRenderer } = this.workspace;
		iconRenderer.renderLeaf(this);
	},
	onOpenTabHeaderMenu: oldFn => function (this: WorkspaceLeaf, evt, tabHeaderEl) {
		oldFn.call(this, evt, tabHeaderEl);
		if (this.isVisible()) return;

		let menu = Menu.forEvent(evt),
			filepath = getFilepathFromLeaf(this),
			viewType = this.view.getViewType(),
			desc: ItemDesc = filepath
				? { id: filepath, category: 'file' }
				: { id: viewType, category: 'leaf' };

		plugin.extendMenu(menu, [desc]);
	}
})

export function patchWorkspaceLeaf(plugin: IconicPlugin) {
	return around(WorkspaceLeaf.prototype, workspaceLeafFactory(plugin));
}