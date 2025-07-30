import { EditorState, RangeSetBuilder, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { tokenClassNodeProp, syntaxTree } from '@codemirror/language';
import { SyntaxNodeRef } from '@lezer/common';
import { App, Component } from 'obsidian';
import { lookBehindNode } from '../../../@external/obsidian-plugin-helper/codemirror';
import { PlainRange, isRegionTouchedByRange } from '../../../@external/obsidian-plugin-helper/global';
import IconicPlugin from '../../../main';
import TagIconManager from '../../../managers/tag-icon-manager';
import TagIconWidget from '../widgets/tag-icon-widget';

const reloadEffect = StateEffect.define<boolean>();

function mustReload(update: ViewUpdate): boolean {
	return update.transactions.some(tr => tr.effects.some(fx => fx.is(reloadEffect)));
}

/**
 * Responsible for rendering tag icons in the editor via {@link ViewPlugin}.
 */
export class EditorTagIconPlugin implements PluginValue {
	public readonly app: App;
	public readonly plugin: IconicPlugin;
	public readonly view: EditorView;
	public readonly iconManager: TagIconManager;

	/**
	 * Manage event handlers called back from the {@link iconManager}.
	 */
	public readonly eventManager: Component;

	/**
	 * Stores icon widgets as a set of `Decoration`.
	 */
	public decorations: DecorationSet;

	constructor(view: EditorView, plugin: IconicPlugin) {
		this.app = plugin.app;
		this.plugin = plugin;
		this.view = view;
		this.iconManager = plugin.tagIconManager;

		// Create new event manager instance and load it.
		this.eventManager = new Component();
		this.eventManager.load();

		// Build the widgets at initialization.
		this.build(view);

		// Register iconManager events to the eventManager.
		this.eventManager.registerEvent(
			this.iconManager.on('iconic:add', () => this.selfUpdate())
		);
		this.eventManager.registerEvent(
			this.iconManager.on('iconic:change', () => this.selfUpdate())
		);
		this.eventManager.registerEvent(
			this.iconManager.on('iconic:delete', () => this.selfUpdate())
		);
	}

	public update(update: ViewUpdate): void {
		// Only update the decorations on document, viewport change, or being
		// affected by reloadEffect.
		if (update.docChanged || update.viewportChanged || mustReload(update))
			this.build(update.view);
	}

	public destroy(): void {
		// Unload the event manager to remove all event refs.
		this.eventManager.unload();
	}

	/**
	 * Build the icon widgets for registered tags.
	 */
	private build(view: EditorView): void {
		let { state } = view,
			builder = new RangeSetBuilder<Decoration>(),
			ranges = view.visibleRanges;
		
		// Build an icon for each tag found in visible ranges.
		EditorTagIconPlugin.iterTags(state, (tagRange, tagName) => {
			let { icon, color } = this.iconManager.getIconItem(tagName);
			if (!icon) return;

			let widget = TagIconWidget.of(this.plugin, tagName, icon, color);
			builder.add(tagRange.from, tagRange.from, widget);
		}, ranges);

		this.decorations = builder.finish();
	}

	/**
	 * Rebuild the decorations without waiting dispatched update.
	 */
	private selfUpdate(): void {
		this.view.dom.win.setTimeout(
			() => this.view.dispatch({ effects: reloadEffect.of(true) })
		);
	}

	/**
	 * Iterate all tags in the specified range.
	 * 
	 * @param state {@link EditorState} instance.
	 * @param callback To be called each time a tag was found.
	 * @param ranges If not specified, it will iterate in the range of
	 * document length.
	 */
	public static iterTags(
		state: EditorState,
		callback: (tagRange: PlainRange, tagName: string) => unknown,
		ranges: PlainRange | readonly PlainRange[] = { from: 0, to: state.doc.length }
	): void {
		let { doc } = state,
			tree = syntaxTree(state),
			boundary: PlainRange;

		if (ranges instanceof Array) {
			if (!ranges.length) boundary = { from: 0, to: state.doc.length };
			else boundary = { from: ranges[0].from, to: ranges.at(-1)!.to };
		} else {
			boundary = ranges;
			ranges = [ranges];
		}

		let tagFrom: number = -1,
			tagTo: number = -1,
			tagName: string = '';

		// Begins to iterate.
		tree.iterate({ ...boundary, enter(node: SyntaxNodeRef) {
			if (!isRegionTouchedByRange(node, ranges)) return;
			let nodeName = node.type.prop(tokenClassNodeProp)
			if (nodeName?.includes('hashtag-begin')) {
				tagFrom = node.from;
				return;
			} else if (nodeName?.includes('hashtag-end')) {
				if (tagFrom < 0) {
					let tagBegin = lookBehindNode(node.node, 'hashtag-begin');
					if (!tagBegin) return;
					tagFrom = tagBegin.from;
				}
				tagTo = node.to;
				tagName = doc.sliceString(tagFrom, tagTo);
				callback({ from: tagFrom, to: tagTo }, tagName);
				tagFrom = tagTo = -1;
			}
		}});
	}
}

/**
 * {@link EditorTagIconPlugin} wrapper to be registered to the editor
 * extensions.
 */
export default function editorTagIconRenderer(plugin: IconicPlugin) {
	return ViewPlugin.define(view => new EditorTagIconPlugin(view, plugin), {
		decorations: viewPlugin => viewPlugin.decorations,
	});
}