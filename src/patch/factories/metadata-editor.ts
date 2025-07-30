import { around, ObjectFactory } from 'monkey-around';
import { MetadataEditor, PropertyEditor } from 'obsidian';
import { mockLeaf } from '../mock/mock-utils';
import IconicPlugin from '../../main';
import MetadataEditorIconRenderer from '../../renderers/component-based/metadata-editor-icon-renderer';

const propertyEditorFactory: ObjectFactory<PropertyEditor> = {
	renderProperty: oldFn => function (this: PropertyEditor, entry, checkErrors, useExpected) {
		if (!this.metadataEditor.iconRenderer)
			return oldFn.call(this, entry, checkErrors, useExpected);

		let newVal = entry.value,
			newKey = entry.key,
			{ type: newType, icon: newDefIcon } = this.app.metadataTypeManager.getTypeInfo(entry).inferred;

		let oldType = this.typeInfo.inferred.type,
			oldVal = this.entry?.value,
			oldKey = this.keyInputEl.value;

		let focused = this.valueEl.contains(this.containerEl.doc.activeElement),
			notEmpty = this.valueEl.hasChildNodes(),
			isSame = oldVal === newVal && oldType === newType && oldKey === newKey;

		oldFn.call(this, entry, checkErrors, useExpected);

		let { iconManager } = this.metadataEditor.iconRenderer,
			{ iconEl } = this,
			iconItem = iconManager.getIconItem(newKey),
			{ id, icon, category, color } = iconItem,
			reuse = true;
		
		icon ??= newDefIcon;

		if (!iconEl.hasClass('iconic-icon')) {
			iconEl.addClass('iconic-icon');
			reuse = false;
		}
		
		if (checkErrors || !focused && !(isSame && notEmpty)) iconManager.plugin.setIcon(
			iconEl,
			{ id, category, icon, color },
			{ rightClick: true, openMenu: true, reuse }
		);
	}
}

const metadataEditorFactory = (plugin: IconicPlugin): ObjectFactory<MetadataEditor> => ({
	onload: oldFn => function (this: MetadataEditor) {
		oldFn.call(this);
		this.iconRenderer = new MetadataEditorIconRenderer(plugin, this);
	}
})

export function patchMetadataEditor(plugin: IconicPlugin) {
	let app = plugin.app,
		patchContracts: (() => unknown)[] = [];

	// Create a WorkspaceLeaf mock to hook the MetadataEditor
	let propertiesPlugin = app.internalPlugins.getPluginById('properties'),
		view = propertiesPlugin.views['file-properties'](mockLeaf(app)),
		{ metadataEditor } = view;
	
	// Fill it with a property, so we can get PropertyEditor's
	// prototype.
	metadataEditor.load();
	metadataEditor.synchronize({ 'test-prop': 'test-value' });
	let metadataEditorProto = Object.getPrototypeOf(metadataEditor) as MetadataEditor,
		propEditor = metadataEditor.rendered[0],
		propEditorProto = Object.getPrototypeOf(propEditor) as PropertyEditor;

	patchContracts.push(
		around(propEditorProto, propertyEditorFactory),
		around(metadataEditorProto, metadataEditorFactory(plugin))
	);
	return () => patchContracts.forEach(uninstaller => uninstaller());
}