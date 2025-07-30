import { around, ObjectFactory } from 'monkey-around';
import { PropertyTypeWidget } from 'obsidian';
import IconicPlugin from '../../main';
import FilePropertyIconRenderer from '../../renderers/component-based/file-property-icon-renderer';
import TagPropertyIconRenderer from '../../renderers/component-based/tag-property-icon-renderer';

const multitextTypeWidgetFactory = (plugin: IconicPlugin): ObjectFactory<PropertyTypeWidget<'multitext'>> => ({
	render: oldFn => (containerEl, data, ctx) => {
		let renderer = oldFn(containerEl, data, ctx);
		if (!plugin.tagIconManager) return renderer;

		new FilePropertyIconRenderer(plugin, renderer);
		return renderer;
	}
});

const textTypeWidgetFactory = (plugin: IconicPlugin): ObjectFactory<PropertyTypeWidget<'text'>> => ({
	render: oldFn => (containerEl, data, ctx) => {
		let renderer = oldFn(containerEl, data, ctx);
		if (!plugin.tagIconManager) return renderer;

		new FilePropertyIconRenderer(plugin, renderer);
		return renderer;
	}
});

const tagsTypeWidgetFactory = (plugin: IconicPlugin): ObjectFactory<PropertyTypeWidget<'tags'>> => ({
	render: oldFn => (containerEl, data, ctx) => {
		let renderer = oldFn(containerEl, data, ctx);
		if (!plugin.tagIconManager) return renderer;

		new TagPropertyIconRenderer(plugin, renderer);
		return renderer;
	}
});

export function patchPropertyWidgets(plugin: IconicPlugin) {
	let { registeredTypeWidgets } = plugin.app.metadataTypeManager,
		multitextPropTypeWidget = registeredTypeWidgets['multitext'],
		textPropTypeWidget = registeredTypeWidgets['text'],
		tagsPropTypeWidget = registeredTypeWidgets['tags'],
		patchContracts: (() => unknown)[] = [];

	patchContracts.push(
		around(multitextPropTypeWidget, multitextTypeWidgetFactory(plugin)),
		around(textPropTypeWidget, textTypeWidgetFactory(plugin)),
		around(tagsPropTypeWidget, tagsTypeWidgetFactory(plugin))
	);

	return (() => patchContracts.forEach(unistaller => unistaller()));
}