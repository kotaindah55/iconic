import { App, BookmarksPluginInstance } from 'obsidian';
import { around, ObjectFactory } from 'monkey-around';

const bookmarksPluginFactory: ObjectFactory<BookmarksPluginInstance> = {
	addItem: oldFn => function (this: BookmarksPluginInstance, item, group) {
		oldFn.call(this, item, group);
		this.trigger('add', item);
	},
	removeItem: oldFn => function (this: BookmarksPluginInstance, item) {
		oldFn.call(this, item);
		this.trigger('remove', item);
	}
};

export function patchBookmarksPlugin(app: App) {
	let bookmarksPlugin = app.internalPlugins.getPluginById('bookmarks').instance;
	return around(bookmarksPlugin, bookmarksPluginFactory);
}