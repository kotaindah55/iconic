import { App, TagTreeItem } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';
import { mockLeaf } from '../mock/mock-utils';

const tagTreeItemFactory: ObjectFactory<TagTreeItem> = {
	setTag: oldFn => function (this: TagTreeItem, newTag) {
		let oldTag = this.tag;
		oldFn.call(this, newTag);
		if (!this.tagView.iconRenderer) return this;

		if (!this.iconEl) {
			this.iconEl = createDiv({ cls: 'iconic-sidekick iconic-icon' });
			this.innerEl.before(this.iconEl);
		}

		if (oldTag !== newTag) {
			let { iconRenderer } = this.tagView,
				{ plugin } = iconRenderer,
				{ icon, color, category } = iconRenderer.iconManager.getIconItem(newTag);

			if (!icon) {
				this.iconEl.empty();
				this.iconEl.hide();
			} else {
				plugin.setIcon(this.iconEl, { id: newTag, category, icon, color });
				this.iconEl.show();
			}
		}

		return this;
	}
}

export function patchTagTreeItem(app: App) {
	let creator = app.internalPlugins.getPluginById('tag-pane').views.tag,
		view = creator(mockLeaf());
	
	view.updateTags();
	let tagTreeItemProto = Object.getPrototypeOf(view.tagDoms['#test']) as TagTreeItem;
	
	return around(tagTreeItemProto, tagTreeItemFactory);
}