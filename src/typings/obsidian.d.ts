/* eslint-disable @typescript-eslint/no-unused-vars */
import 'obsidian';
import AllPropertiesIconRenderer from 'src/renderers/component-based/all-properties-icon-renderer';
import BookmarksIconRenderer from 'src/renderers/component-based/bookmarks-icon-renderer';
import FileExplorerIconRenderer from 'src/renderers/component-based/file-explorer-icon-renderer';
import LeafIconRenderer from 'src/renderers/component-based/leaf-icon-renderer';
import MetadataEditorIconRenderer from 'src/renderers/component-based/metadata-editor-icon-renderer';
import RibbonIconRenderer from 'src/renderers/component-based/ribbon-icon-renderer';
import TagPaneIconRenderer from 'src/renderers/component-based/tag-pane-icon-renderer';
import TagPropertyIconRenderer from 'src/renderers/component-based/tag-property-icon-renderer';
import NoteTitleIconRenderer from 'src/renderers/component-based/note-title-icon-renderer';
import FilePropertyIconRenderer from 'src/renderers/component-based/file-property-icon-renderer';
import FileSuggestIconProvider from 'src/renderers/icon-provider/file-suggest-icon-provider';
import TagSuggestIconProvider from 'src/renderers/icon-provider/tag-suggest-icon-provider';

declare module 'obsidian' {
	interface AbstractFileTreeItem<T extends TAbstractFile> {
		/** @patch */
		iconEl: HTMLElement;
	}

	interface AllPropertiesView {
		/** @patch */
		iconRenderer: AllPropertiesIconRenderer;
	}

	interface BookmarkGroupTreeItem {
		/** @patch */
		iconEl: HTMLElement;
	}

	interface BookmarksPluginInstance {
		/** @patch */
		on(name: 'add', callback: (item: BookmarkItem) => unknown, ctx?: unknown): EventRef;
		/** @patch */
		on(name: 'remove', callback: (item: BookmarkItem) => unknown, ctx?: unknown): EventRef;
	}

	interface BookmarksView {
		/** @patch */
		iconRenderer: BookmarksIconRenderer;
	}

	interface FileExplorerView {
		/** @patch */
		iconRenderer: FileExplorerIconRenderer;
	}

	interface FileSuggestModal {
		/** @patch */
		iconProvider: FileSuggestIconProvider;
	}

	interface MarkdownView {
		/** @patch */
		iconRenderer: NoteTitleIconRenderer;
		/** @patch */
		iconTitleEl: HTMLElement;
		/** @patch */
		inlineTitleEl: HTMLElement;
		/** @patch */
		inlineTitleWrapperEl: HTMLElement;
	}

	interface MetadataEditor {
		/** @patch */
		iconRenderer: MetadataEditorIconRenderer;
	}

	interface MetadataTypeManager {
		/** @patch */
		on(name: 'rename', callback: (oldKey: string, newKey: string) => unknown, ctx?: unknown): EventRef;
	}

	interface MultiTextPropertyWidget {
		/** @patch */
		iconRenderer?: FilePropertyIconRenderer;
	}

	interface TagTreeItem {
		/** @patch */
		iconEl: HTMLElement;
	}

	interface TagsPropertyWidget {
		/** @patch */
		iconRenderer?: TagPropertyIconRenderer;
	}

	interface TagSuggest {
		/** @patch */
		iconProvider: TagSuggestIconProvider;
	}

	interface TagView {
		/** @patch */
		iconRenderer: TagPaneIconRenderer;
	}

	interface TextPropertyWidget {
		/** @patch */
		iconRenderer?: FilePropertyIconRenderer;
	}

	interface WikilinkSuggest {
		/** @patch */
		iconProvider: FileSuggestIconProvider;
	}

	interface Workspace {
		/** @patch */
		iconRenderer: LeafIconRenderer;
		on(name: 'iconic:plugin-unload', callback: () => unknown, ctx?: unknown): EventRef;
		on(name: 'iconic:ribbon-item-add', callback: (item: RibbonItem) => unknown, ctx?: unknown): EventRef;
	}

	interface WorkspaceLeaf {
		on(name: 'markdown-view:mode-change', callback: (view: MarkdownView) => unknown, ctx?: unknown): EventRef;
	}

	interface WorkspaceRibbon {
		/** @patch */
		iconRenderer: RibbonIconRenderer;
	}
}