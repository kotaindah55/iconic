import { around, ObjectFactory } from 'monkey-around';
import { WorkspaceRibbon } from 'obsidian';

const workspaceRibbonFactory: ObjectFactory<WorkspaceRibbon> = {
	addRibbonItemButton: oldFn => function (this: WorkspaceRibbon, id, icon, title, callback) {
		let buttonEl = oldFn.call(this, id, icon, title, callback);
		if (!this.iconRenderer) return buttonEl;

		let ribbonItem = this.items.find(item => item.id === id);
		if (ribbonItem) {
			this.iconRenderer.attachMenuHandler(ribbonItem);
			this.iconRenderer.renderRibbonIcon(ribbonItem);
		}
		return buttonEl;
	}
}

export function patchWorkspaceRibbon() {
	return around(WorkspaceRibbon.prototype, workspaceRibbonFactory);
}