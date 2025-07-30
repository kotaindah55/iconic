import {
	AllPropertiesView,
	App,
	BookmarksView,
	FileExplorerView,
	FilePropertiesView,
	MarkdownView,
	Menu,
	Platform,
	PluginManifest,
	TAbstractFile,
	TagView,
	TFile,
	WorkspaceLeaf
} from 'obsidian';
import { Prec, RangeSet } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';

import { getMenuItemsBySection, PluginBase } from './@external/obsidian-plugin-helper/src/obsidian';

import { IconBase, IconItem, IconItemCategory } from './model/icon-item';
import { RuleItem } from './model/rule';

import { getTagsByRanges } from './utils/editor-utils';
import { isEq, setIconWithColor } from './utils/icon-utils';

import Locales from './locales';
import DEFAULT_SETTINGS from './constants/default-settings';
import IconicSettings, { AppearanceSettings } from './model/settings';
import IconicSettingTab from './setting-tab';
import IconicAPI from './api';

import IconManager from './managers/icon-manager';
import FileIconManager from './managers/file-icon-manager';
import BookmarkIconManager from './managers/bookmark-icon-manager';
import TagIconManager from './managers/tag-icon-manager';
import PropertyIconManager from './managers/property-icon-manager';
import RibbonIconManager from './managers/ribbon-icon-manager';
import LeafIconManager from './managers/leaf-icon-manager';
import RuleManager from './ruler/rule-manager';

import {
	patchBookmarksPlugin,
	patchBookmarksView,
	patchDragManager,
	patchFileManager,
	patchFileSuggestModal,
	patchFolderTreeItem,
	patchMarkdownView,
	patchMetadataEditor,
	patchPropertyTreeItem,
	patchPropertyWidgets,
	patchTagSuggest,
	patchTagTreeItem,
	patchWikilinkSuggest,
	patchWorkspace,
	patchWorkspaceLeaf,
	patchWorkspaceRibbon
} from './patch/patches';

import ShortCodeSuggester from './renderers/editor/suggest/shortcode-suggester';
import TagIconPostProcessor from './renderers/postprocessor/tag-icon-postprocessor';
import ShortCodePostProcessor from './renderers/postprocessor/shortcode-postprocessor';
import editorTagIconRenderer, { EditorTagIconPlugin } from './renderers/editor/view-plugins/editor-tag-icon-renderer';
import shortCodeState from './renderers/editor/parser/shortcode-state';
import iconShortcodeRenderer from './renderers/editor/view-plugins/icon-shortcode-renderer';
import clickCoordsHook from './renderers/editor/helper/click-hook';

import IconRenderer from './renderers/component-based/icon-renderer';
import LeafIconRenderer from './renderers/component-based/leaf-icon-renderer';
import RibbonIconRenderer from './renderers/component-based/ribbon-icon-renderer';
import FileExplorerIconRenderer from './renderers/component-based/file-explorer-icon-renderer';
import BookmarksIconRenderer from './renderers/component-based/bookmarks-icon-renderer';
import AllPropertiesIconRenderer from './renderers/component-based/all-properties-icon-renderer';
import NoteTitleIconRenderer from './renderers/component-based/note-title-icon-renderer';
import TagPaneIconRenderer from './renderers/component-based/tag-pane-icon-renderer';
import MetadataEditorIconRenderer from './renderers/component-based/metadata-editor-icon-renderer';

import IconPicker, { ItemDesc } from './dialogs/icon-picker';
import RulePicker from './dialogs/rule-picker';
import RuleEditor from './dialogs/rule-editor';

export interface SetIconOption extends AddEventListenerOptions {
	noHandler?: boolean;
	openMenu?: boolean;
	reuse?: boolean;
	rightClick?: boolean;
}

export interface ManagerMap {
	'rule': RuleManager;
	'file': FileIconManager;
	'folder': FileIconManager;
	'bookmark': BookmarkIconManager;
	'tag': TagIconManager;
	'leaf': LeafIconManager;
	'property': PropertyIconManager;
	'ribbon': RibbonIconManager;
}

export default class IconicPlugin extends PluginBase<IconicSettings> {
	public api: IconicAPI;

	public ruleManager: RuleManager;
	public fileIconManager: FileIconManager;
	public bookmarkIconManager: BookmarkIconManager;
	public tagIconManager: TagIconManager;
	public leafIconManager: LeafIconManager;
	public propertyIconManager: PropertyIconManager;
	public ribbonIconManager: RibbonIconManager;
	
	public settingTab: IconicSettingTab;

	public readonly firstResolve: Promise<void>;
	public readonly editorTagViewPlugin: ViewPlugin<EditorTagIconPlugin, undefined>;
	public readonly shortCodeSuggester: ShortCodeSuggester;

	public get clickableIcon(): boolean {
		let clickable = this.settings.clickableIcons;
		return (
			clickable === 'on' ||
			Platform.isDesktop && clickable === 'desktop' ||
			Platform.isMobile && clickable === 'mobile'
		);
	}

	public get sortCodeSuggest(): boolean {
		let mustShow = this.settings.shortCodeSuggest;
		return (
			mustShow === 'on' ||
			Platform.isDesktop && mustShow === 'desktop' ||
			Platform.isMobile && mustShow === 'mobile'
		);
	}

	public get actionMenu(): boolean {
		return this.settings.showMenuActions;
	}

	public get defaultSettings(): IconicSettings {
		return DEFAULT_SETTINGS;
	}

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.editorTagViewPlugin = editorTagIconRenderer(this);
		this.shortCodeSuggester = new ShortCodeSuggester(this);

		this.firstResolve = new Promise(resolve => {
			let resolveRef = this.app.metadataCache.on('resolved', () => {
				this.app.metadataCache.offref(resolveRef);
				resolve();
			});

			this.onUserEnable = () => {
				this.tryInjectRendererIntoMetadataEditor();
				this.app.metadataCache.offref(resolveRef);
				resolve();
			};
		});
	}

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.settingTab = new IconicSettingTab(this);
		this.addSettingTab(this.settingTab);
		this.setAppearance(this.settings);

		this.ruleManager = new RuleManager(this);
		this.fileIconManager = new FileIconManager(this);
		this.bookmarkIconManager = new BookmarkIconManager(this);
		this.tagIconManager = new TagIconManager(this);
		this.leafIconManager = new LeafIconManager(this);
		this.propertyIconManager = new PropertyIconManager(this);
		this.ribbonIconManager = new RibbonIconManager(this);

		this.api = new IconicAPI(this);
		(globalThis as unknown as { iconic: IconicAPI }).iconic = this.api;

		this.register(patchBookmarksPlugin(this.app));
		this.register(patchBookmarksView(this.app));
		this.register(patchDragManager(this));
		this.register(patchFileManager(this.app));
		this.register(patchFileSuggestModal(this));
		this.register(patchFolderTreeItem(this.app));
		this.register(patchMarkdownView());
		this.register(patchMetadataEditor(this));
		this.register(patchPropertyTreeItem(this));
		this.register(patchPropertyWidgets(this));
		this.register(patchTagTreeItem(this.app));
		this.register(patchTagSuggest(this));
		this.register(patchWikilinkSuggest(this));
		this.register(patchWorkspaceLeaf(this));
		this.register(patchWorkspaceRibbon());
		this.register(patchWorkspace());

		this.registerMarkdownPostProcessor((containerEl, ctx) => {
			ctx.addChild(new TagIconPostProcessor(containerEl, this));
			ctx.addChild(new ShortCodePostProcessor(containerEl, ctx));
		});

		this.registerEditorExtension([
			shortCodeState,
			this.editorTagViewPlugin,
			Prec.highest(clickCoordsHook),
			iconShortcodeRenderer,
			EditorView.atomicRanges.of(
				view => view.plugin(iconShortcodeRenderer)?.decorations ?? RangeSet.empty
			)
		]);

		this.registerEditorSuggest(this.shortCodeSuggester);
		this.registerEditorSuggest(this.shortCodeSuggester.colorSuggester);

		new LeafIconRenderer(this).load();
		new RibbonIconRenderer(this).load();

		this.app.workspace.onLayoutReady(() => {
			this.app.workspace.iterateAllLeaves(leaf => this.tryInjectRenderer(leaf));
		});

		this.registerEvent(this.app.workspace.on('active-leaf-change', leaf => {
			if (leaf) this.tryInjectRenderer(leaf);
		}));

		/* this.registerEvent(this.app.workspace.on('deferred-load', leaf => {
			this.tryInjectRenderer(leaf);
		})); */

		this.registerUndeferCallback(leaf => this.tryInjectRenderer(leaf));

		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
			if (!this.settings.showMenuActions) return;
			let clickCoords = editor.cm.plugin(clickCoordsHook);
			if (!clickCoords) return;
			let pos = editor.cm.posAtCoords(clickCoords);
			if (pos === null) return;
			let tags = getTagsByRanges(editor.cm.state, [{ from: pos, to: pos }]);
			if (!tags.length) return;
			this.extendMenu(menu, tags.map(tag => ({ id: tag, category: 'tag' })));
		}));

		// Provide icon altering from the file menu.
		this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
			if (!this.actionMenu) return;
			this.extendMenu(menu, [{
				id: file.path,
				category: file instanceof TFile ? 'file' as const : 'folder' as const
			}]);
		}));

		// Also provide icon altering for more than a single file at a time.
		this.registerEvent(this.app.workspace.on('files-menu', (menu, files) => {
			if (!this.actionMenu) return;
			let itemDescs = files.map(file => ({
				id: file.path,
				category: file instanceof TFile ? 'file' as const : 'folder' as const
			}));
			this.extendMenu(menu, itemDescs);
		}));

		this.registerEvent(this.app.workspace.on('tab-group-menu', (menu, tab) => queueMicrotask(() => {
			let tablistItems = getMenuItemsBySection(menu, 'tablist');
			tab.children.forEach((leaf, idx) => {
				let item = tablistItems[idx],
					iconSVG = leaf.tabHeaderInnerIconEl.firstElementChild;
				if (!item || !iconSVG) return;
				item.iconEl.addClass('iconic-icon');
				item.iconEl.empty();
				item.iconEl.append(iconSVG.cloneNode(true));
			});
		})));

		this.registerEvent(this.settingManager.on('settings-change', changed => {
			this.setAppearance(changed);
		}));

		// RIBBON: Open rulebook
		this.addRibbonIcon(
			'lucide-book-image',
			Locales.t('commands.openRulebook'),
			() => this.openRulePicker()
		);

		// COMMAND: Open rulebook
		this.addCommand({
			id: 'open-rulebook',
			icon: 'lucide-book-image',
			name: Locales.t('commands.openRulebook'),
			callback: () => this.openRulePicker(),
		});

		// COMMAND: Open rulebook
		this.addCommand({
			id: 'toggle-clickable-icons',
			icon: 'lucide-mouse-pointer-click',
			name: Locales.t(`commands.toggleClickableIcons.${Platform.isDesktop ? 'desktop' : 'mobile'}`),
			callback: () => this.toggleClickableIcon(),
		});

		// COMMAND: Toggle all file icons
		this.addCommand({
			id: 'toggle-all-file-icons',
			name: Locales.t('commands.toggleAllFileIcons'),
			callback: () => {
				this.settings.showAllFileIcons = !this.settings.showAllFileIcons;
				this.requestSave();
				this.ruleManager.trigger('iconic:update', 'file');
			}
		});

		// COMMAND: Toggle all folder icons
		this.addCommand({
			id: 'toggle-all-folder-icons',
			name: Locales.t('commands.toggleAllFolderIcons'),
			callback: () => {
				this.settings.showAllFolderIcons = !this.settings.showAllFolderIcons;
				this.requestSave();
				this.ruleManager.trigger('iconic:update', 'folder');
			}
		});

		// COMMAND: Change icon of the current file
		this.addCommand({
			id: 'change-icon-current-file',
			name: Locales.t('commands.changeIconCurrentFile'),
			checkCallback: checking => {
				let file = this.app.workspace.getActiveFile();
				if (checking) return !!file;
				if (!file) return false;

				let { id, category } = this.fileIconManager.getIconItem(file.path);
				this.openIconPicker([{ id, category }]);
			}
		});
	}

	public onunload(): void {
		this.app.workspace.trigger('iconic:plugin-unload');
		delete (globalThis as unknown as Record<string, unknown>).iconic;
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	public purgeSettings(): void {
		for (let key in this.settings) {
			if (!(key in DEFAULT_SETTINGS))
				delete (this.settings as unknown as Record<string, unknown>)[key];
		}
	}

	public getManager<T extends IconItemCategory>(category: T): ManagerMap[T];
	public getManager(category: IconItemCategory): RuleManager | IconManager {
		if (category === 'rule') return this.ruleManager;
		if (category === 'file' || category === 'folder') return this.fileIconManager;
		if (category === 'bookmark') return this.bookmarkIconManager;
		if (category === 'tag') return this.tagIconManager;
		if (category === 'leaf') return this.leafIconManager;
		if (category === 'property') return this.propertyIconManager;
		return this.ribbonIconManager;
	}

	public getIconItem(category: IconItemCategory, id: string): IconItem {
		let manager = this.getManager(category);
		return manager.getIconItem(id);
	}

	public getItemName(category: IconItemCategory, id: string): string {
		if (category === 'rule') {
			let page = this.ruleManager.checkPage(id);
			if (!page) return '';
			return this.ruleManager.getRule(page, id)?.name ?? '';
		}
		if (category === 'file' || category === 'folder')
			return this.app.vault.getAbstractFileByPath(id)?.name ?? '';
		if (category === 'bookmark')
			return this.bookmarkIconManager.bookmarkMap[id].title ?? '';
		if (category === 'ribbon')
			return id.replace(/^\w+:/, '');
		else return id;
	}

	public openIconPicker(descs: ItemDesc[], deferRuleIcon = false): void {
		new IconPicker(this, descs, deferRuleIcon).open();
	}

	public openRulePicker(): void {
		new RulePicker(this).open();
	}

	public openRuleEditor(rule: RuleItem): void {
		new RuleEditor(this, rule, true).open();
	}

	public setIcon(parent: HTMLElement, desc: ItemDesc & IconBase, option?: SetIconOption): void {
		let { id, category, icon, color } = desc,
			eventType = option?.rightClick ? 'contextmenu' as const : 'click' as const;
		
		try_reusing: if (option?.reuse) {
			let iconSVGOrEmoji = parent.find(':scope > svg.svg-icon, :scope > .iconic-emoji');
			if (!iconSVGOrEmoji) break try_reusing;
			if (isEq(iconSVGOrEmoji, desc)) return;
		}

		let iconSVGOrEmoji = setIconWithColor(parent, icon, color)
		
		if (!option?.noHandler) iconSVGOrEmoji?.addEventListener(eventType, (evt: MouseEvent) => {
			if (option?.openMenu && this.actionMenu) {
				this.extendMenu(Menu.forEvent(evt), [desc]);
				evt.stopPropagation();
			} else if (this.clickableIcon) {
				this.openIconPicker([{ id, category }]);
				evt.stopPropagation();
			}
		}, { ...option });
	}

	public setAppearance(config: Partial<AppearanceSettings>): void {
		let platform = Platform.isDesktop ? 'desktop' : 'mobile',
			body = this.app.dom.appContainerEl.doc.body;

		if (config.biggerIcons === 'on' || config.biggerIcons === platform) {
			body.addClass('iconic-bigger-icons');
		} else {
			body.removeClass('iconic-bigger-icons');
		}

		if (config.clickableIcons === 'on' || config.clickableIcons === platform) {
			body.addClass('iconic-clickable-icons');
		} else {
			body.removeClass('iconic-clickable-icons');
		}

		if ('uncolorHover' in config)
			body.toggleClass('iconic-uncolor-hover', config.uncolorHover!);
		if ('uncolorDrag' in config)
			body.toggleClass('iconic-uncolor-drag', config.uncolorDrag!);
		if ('uncolorSelect' in config)
			body.toggleClass('iconic-uncolor-select', config.uncolorSelect!);
		if ('uncolorQuick' in config)
			body.toggleClass('iconic-uncolor-quick-ribbon', config.uncolorQuick!);
	}

	public extendMenu(menu: Menu, descs: ItemDesc[]): void {
		// Check if any of the descs has its id being registered.
		let anyRegistered = descs.some(({ id, category }) => {
			let manager = this.getManager(category),
				registered = false;
			if (manager instanceof RuleManager) registered = !!manager.checkPage(id);
			else registered = !!manager.iconMap[id];
			return registered;
		});

		let firstDesc = descs[0];

		// Add "Change icon" option.
		menu.addItem(item => item
			.setTitle(Locales.t('menu.changeIcon', { count: descs.length }))
			.setIcon('lucide-image-plus')
			.setSection('iconic-icon-edit')
			.onClick(() => this.openIconPicker(descs))
		);

		// Add "Remove icon" option if the any id is registered to an icon.
		if (anyRegistered) menu.addItem(item => item
			.setTitle(Locales.t('menu.removeIcon', { count: descs.length }))
			.setIcon('lucide-image-minus')
			.setSection('iconic-icon-edit')
			.onClick(() => descs.forEach(({ id, category }) => {
				let manager = this.getManager(category);
				if (manager instanceof RuleManager) {
					let page = manager.checkPage(id);
					if (page) manager.deleteRule(page, id);
				} else {
					manager.deleteIcon(id);
				}
			}))
		);

		// "Edit rule" option is only added when there is only one item.
		if (descs.length !== 1) return;

		// Preparation for rule checking.
		let file: TAbstractFile | null = null;
		if (firstDesc.category === 'file' || firstDesc.category === 'folder')
			file = this.app.vault.getAbstractFileByPath(firstDesc.id);
		else if (firstDesc.category === 'bookmark')
			file = this.bookmarkIconManager.getFileFromBookmark(firstDesc.id);
		
		if (!file) return;

		// Add "Edit rule" option.
		let rule = this.ruleManager.getRuleFromFile(file);
		if (rule) menu.addItem(item => item
			.setTitle(Locales.t('menu.editRule'))
			.setIcon('lucide-image-play')
			.setSection('iconic-icon-edit')
			.onClick(() => this.openRuleEditor(rule))
		);
	}

	public toggleClickableIcon(): void {
		let clickable = this.settings.clickableIcons;

		if (clickable === 'on') clickable = 'desktop';
		else if (clickable === 'desktop') clickable = 'mobile';
		else if (clickable === 'mobile') clickable = 'off';
		else clickable = 'on';

		this.setAppearance({ clickableIcons: clickable });
		this.requestSave();
	}

	private tryInjectRenderer(leaf: WorkspaceLeaf): void {
		if (leaf.isDeferred) return;

		let viewType = leaf.view.getViewType(),
			{ view } = leaf;
		if ('iconRenderer' in view && view.iconRenderer instanceof IconRenderer) return;
		
		if (viewType === 'file-explorer')
			new FileExplorerIconRenderer(this, view as FileExplorerView);
		else if (viewType === 'bookmarks')
			new BookmarksIconRenderer(this, view as BookmarksView);
		else if (viewType === 'all-properties')
			new AllPropertiesIconRenderer(this, view as AllPropertiesView);
		else if (viewType === 'tag')
			new TagPaneIconRenderer(this, view as TagView)
		else if (view instanceof MarkdownView)
			new NoteTitleIconRenderer(this, view);
	}

	private tryInjectRendererIntoMetadataEditor() {
		this.app.workspace.iterateAllLeaves(leaf => {
			if (leaf.isDeferred) return;

			let viewType = leaf.view.getViewType(),
			{ view } = leaf;

			if (view instanceof MarkdownView || viewType === 'file-properties') {
				let { metadataEditor } = (view as MarkdownView | FilePropertiesView);
				if (!metadataEditor || metadataEditor.iconRenderer) return;
				new MetadataEditorIconRenderer(this, metadataEditor);
			}
		});
	}
}