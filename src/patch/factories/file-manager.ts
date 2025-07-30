import { around, ObjectFactory } from 'monkey-around';
import { App, FileManager } from 'obsidian';

const RESERVED_PROPERTIES = ['aliases', 'cssclasses', 'tags'];

const fileManagerFactory: ObjectFactory<FileManager> = {
	renameProperty: oldFn => function (this: FileManager, oldKey, newKey) {
		let { metadataTypeManager } = this.app;

		if (
			metadataTypeManager.types[oldKey] &&
			!RESERVED_PROPERTIES.includes(oldKey) &&
			!RESERVED_PROPERTIES.includes(newKey) &&
			oldKey !== newKey
		) metadataTypeManager.trigger('rename', oldKey, newKey);

		return oldFn(oldKey, newKey);
	}
}

export function patchFileManager(app: App) {
	let fileManagerProto = Object.getPrototypeOf(app.fileManager) as FileManager;
	return around(fileManagerProto, fileManagerFactory);
}