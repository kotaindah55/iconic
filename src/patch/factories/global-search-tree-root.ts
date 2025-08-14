import { around, ObjectFactory } from 'monkey-around';
import { App, GlobalSearchTreeRoot } from 'obsidian';
import { mockLeaf } from '../mock/mock-utils';

const globalSearchTreeRootFactory: ObjectFactory<GlobalSearchTreeRoot> = {
	addResult: oldFn => function (this: GlobalSearchTreeRoot, file, result, content, showTitle) {
		let item = oldFn.call(this, file, result, content, showTitle);
		if (file) this.view?.iconRenderer.appendSingleIconEl(file.path);
		return item;
	}
}

export function patchGlobalSearchTreeRoot(app: App) {
	let creator = app.internalPlugins.getPluginById('global-search').views['search'],
		view = creator(mockLeaf());

	let treeRootProto = Object.getPrototypeOf(view.dom) as GlobalSearchTreeRoot;
	
	return around(treeRootProto, globalSearchTreeRootFactory);
}