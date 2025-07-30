import { App, debounce, Debouncer, EventRef, Events, TAbstractFile, TFolder } from 'obsidian';
import { RuleItem, RulePage, RuleSpec } from '../model/rule';
import { IconBase, IconItem } from '../model/icon-item';
import IconicPlugin from '../main';
import createJudger from './judger';

/**
 * Handles core rule logic, dispatching specific events when the rule
 * was changed.
 */
export default class RuleManager extends Events {
	public readonly app: App;
	public readonly plugin: IconicPlugin;

	private readonly fileRules: RuleItem[];
	private readonly fileRuleMap: Record<string, RuleItem>;
	private readonly folderRules: RuleItem[];
	private readonly folderRuleMap: Record<string, RuleItem>;

	private hasDeferredUpdate: RulePage | boolean;
	private reactedFilepathSoon: string | null;
	private requestReact: Debouncer<[string], void>;

	/**
	 * If true, then it should react on MetadataCache's `change` event.
	 */
	#fileRuleReactive: boolean;

	/**
	 * It's always false as a folder doesn't have any metadata.
	 */
	#folderRuleReactive: boolean;

	public get fileRuleReactive(): boolean {
		return this.#fileRuleReactive;
	}

	public get folderRuleReactive(): boolean {
		return this.#folderRuleReactive;
	}

	constructor(plugin: IconicPlugin) {
		super();
		this.app = plugin.app;
		this.plugin = plugin;

		this.fileRules = plugin.settings.fileRules;
		this.folderRules = plugin.settings.folderRules;
		this.fileRuleMap = {};
		this.folderRuleMap = {};

		this.hasDeferredUpdate = false;
		this.reactedFilepathSoon = null;
		this.requestReact = debounce(filepath => {
			this.reactedFilepathSoon = null;
			this.trigger('iconic:react', filepath);
		}, 200);

		this.#fileRuleReactive = false;
		this.#folderRuleReactive = false;

		// Listening to the MetadataCache's "changed" event, dispatching "react"
		// event in the reactive state, or if the "useProperty" setting is set
		// to true.
		this.plugin.registerEvent(this.app.metadataCache.on('changed', file => {
			if (!this.#fileRuleReactive && !this.plugin.settings.useProperty) return;
			// Avoid rapid reaction by implementing debouncer.
			if (this.reactedFilepathSoon === file.path) return;
			this.requestReact.run();
			this.requestReact(file.path);
			this.reactedFilepathSoon = file.path;
		}));

		this.buildRules();
	}

	/**
	 * Triggered when MetadataCache's "changed" event is dispatched in the
	 * reactive state.
	 */
	public on(name: 'iconic:react', callback: (filepath: string) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when the user makes any change to the page rules.
	 */
	public on(name: 'iconic:update', callback: (page: RulePage) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when the user changes the rules' order.
	 */
	public on(name: 'iconic:reorder', callback: (page: RulePage) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when the user adds a rule.
	 */
	public on(name: 'iconic:add', callback: (rule: RuleItem) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when the user changes, or toggles, a rule.
	 */
	public on(name: 'iconic:change', callback: (oldRule: RuleItem, newRule: RuleItem) => unknown, ctx?: unknown): EventRef;
	/**
	 * Triggered when the user deletes a rule.
	 */
	public on(name: 'iconic:delete', callback: (deletedRule: RuleItem) => unknown, ctx?: unknown): EventRef;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public on(name: string, callback: (...data: any[]) => unknown, ctx?: unknown): EventRef {
		return super.on(name, callback, ctx);
	}

	/**
	 * Get specific rule that corresponds to the given id.
	 */
	public getRule(page: RulePage, id: string): RuleItem | undefined {
		return page === 'file'
			? this.fileRuleMap[id]
			: this.folderRuleMap[id];
	}

	public getRules(page: RulePage): Record<string, RuleItem> {
		return page === 'file'
			? this.fileRuleMap
			: this.folderRuleMap;
	}

	/**
	 * Add a page rule, its id will be generated automatically.
	 */
	public addRule(page: RulePage, spec: RuleSpec, enabled = false, defer = false): void {
		let id = Date.now().toString(36),
			rule: RuleItem = { ...spec, page, id, enabled },
			reactive = false;
		
		// Create a judger from the rule.
		rule.judger = createJudger(this.app, rule);
		reactive = rule.judger.reactive ?? false;

		// Map the rule onto its id.
		if (rule.page === 'file') {
			this.fileRules.push(rule);
			this.fileRuleMap[id] = rule;
			if (enabled && reactive) this.#fileRuleReactive = true;
		} else {
			// Folder rules don't have reactive state, indeed.
			this.folderRules.push(rule);
			this.folderRuleMap[id] = rule;
		}

		this.plugin.requestSave();
		// Dispatch "add" event.
		this.trigger('iconic:add', rule);
		
		if (rule.enabled) {
			if (defer) this.deferUpdate(page);
			else this.trigger('iconic:update', page);
		}
	}

	/**
	 * Toggle specific rule that corresponds to the given id.
	 */
	public toggleRule(page: RulePage, id: string, val?: boolean, defer = false): void {
		let rule = this.getRule(page, id);
		if (!rule) return;
		
		// Use val as an on/off state if isn't undefined.
		let isPrevEnabled = rule.enabled;
		if (val === undefined) rule.enabled = !rule.enabled;
		else rule.enabled = val;

		// Only dispatch "change" event when it has actually been toggled.
		if (isPrevEnabled !== rule.enabled) {
			this.plugin.requestSave();
			this.updateReactivity();
			this.trigger('iconic:change', { ...rule, enabled: isPrevEnabled }, rule);
			if (defer) this.deferUpdate(page);
			else this.trigger('iconic:update', page);
		}
	}

	/**
	 * Edit specific rule with the given rule spec.
	 */
	public editRule(page: RulePage, id: string, spec: Partial<RuleSpec>, defer = false): void {
		let rule = this.getRule(page, id);
		if (!rule) return;

		// Keep the old rule for a while, will be passed the trigger() argument.
		let prevRule: RuleItem = { ...rule };
		Object.assign(rule, spec);
		this.plugin.requestSave();
		
		// Only dispatch "change" event when the old one is not the same as the
		// new one.
		if (!RuleManager.eq(rule, prevRule)) {
			rule.judger = createJudger(this.app, rule);
			this.updateReactivity();
			this.trigger('iconic:change', prevRule, rule);

			// Don't dispatch "update" event when the rule hasn't been enabled yet.
			if (!rule.enabled && rule.enabled == prevRule.enabled) return;
			if (defer) this.deferUpdate(page);
			else this.trigger('iconic:update', page);
		}
	}

	/**
	 * Move the order of specific rule to the given index.
	 */
	public moveRule(page: RulePage, id: string, targetIdx: number, defer = false): void {
		let rule = this.getRule(page, id);
		if (!rule) return;

		let rules = page === 'file' ? this.fileRules : this.folderRules,
			oldIdx = rules.indexOf(rule);
		if (oldIdx < 0) return;
		
		if (targetIdx < 0) targetIdx = 0;
		else if (targetIdx >= rules.length) targetIdx = rules.length - 1;
		// Don't dispatch the "reorder" event if it doesn't actually move.
		if (oldIdx === targetIdx) return;

		rules.splice(oldIdx, 1);
		rules.splice(targetIdx, 0, rule);
		this.plugin.requestSave();

		// Dispatch "reorder" event.
		this.trigger('iconic:reorder', page);

		// Only dispatch "update" event if it's enabled.
		if (rule.enabled) {
			if (defer) this.deferUpdate(page);
			else this.trigger('iconic:update', page);
		}
	}

	/**
	 * Delete specific rule that corresponds to the given id.
	 */
	public deleteRule(page: RulePage, id: string, defer = false) {
		// Keep the old rule for a while, will be passed the trigger() argument.
		let rule = this.getRule(page, id);
		if (!rule) return;

		let ruleMap = page === 'file' ? this.fileRuleMap : this.folderRuleMap,
			rules = page === 'file' ? this.fileRules : this.folderRules;
		delete ruleMap[id];
		rules.remove(rule);

		this.plugin.requestSave();
		this.updateReactivity();

		// Dispatch "delete" event.
		this.trigger('iconic:delete', rule);

		// Only dispatch "update" event if it was previously enabled.
		if (rule.enabled) {
			if (defer) this.deferUpdate(page);
			else this.trigger('iconic:update', page);
		}
	}

	/**
	 * Get an iconBase from the given file/folder.
	 * @param fileOrPath Either a file path or {@link TAbstractFile} instance.
	 * @returns Returns undefined when the file doesn't match any rule.
	 */
	public getIconBase(fileOrPath: string | TAbstractFile): IconBase | undefined {
		let rule = this.getRuleFromFile(fileOrPath);
		if (!rule) return;
		return { icon: rule.icon, color: rule.color };
	}

	/**
	 * Get icon item from corresponding id (rule id).
	 * @param id Rule id.
	 */
	public getIconItem(id: string): IconItem {
		let iconItem: IconItem = { id, category: 'rule' },
			page = this.checkPage(id);
		
		// Id wasn't found in both pages.
		if (!page) return iconItem;

		let ruleItem = this.getRule(page, id)!;
		iconItem.icon = ruleItem.icon;
		iconItem.color = ruleItem.color;
		return iconItem;
	}

	/**
	 * Get rule that's currently ruling the given file/folder.
	 * @returns Returns undefined when the file doesn't match any rule.
	 */
	public getRuleFromFile(fileOrPath: string | TAbstractFile): RuleItem | undefined {
		let file = fileOrPath instanceof TAbstractFile
				? fileOrPath
				: this.app.vault.getAbstractFileByPath(fileOrPath),
			isFolder = file instanceof TFolder;
		if (!file) return;

		let rules = isFolder ? this.folderRules : this.fileRules;

		// Use all available judgers one by one to find corresponding rule.
		return rules.find(rule => (rule.enabled && rule.judger?.(file)) ?? false);
	}

	/**
	 * Check which page is the rule's within.
	 * @param id Rule id.
	 */
	public checkPage(id: string): RulePage | undefined {
		// A rule id must be unique from the others, even if it has different page.
		return this.fileRuleMap[id]?.page ?? this.folderRuleMap[id]?.page;
	}

	/**
	 * Get qualified files/folders corresponding to the specific rule.
	 */
	public qualify(page: RulePage, id: string): TAbstractFile[] {
		let rule = this.getRule(page, id);
		if (!rule) return [];

		let files: TAbstractFile[] = page === 'file'
			? this.app.vault.getFiles()
			: this.app.vault.getAllFolders();
		
		return files.filter(file => !!rule.judger?.(file));
	}

	/**
	 * Trigger deferred update if any.
	 */
	public triggerDeferredUpdate(): void {
		if (!this.hasDeferredUpdate) return;

		if (this.hasDeferredUpdate === true) {
			this.trigger('iconic:update', 'file');
			this.trigger('iconic:update', 'folder');
		} else {
			this.trigger('iconic:update', this.hasDeferredUpdate);
		}

		this.hasDeferredUpdate = false;
	}

	/**
	 * Defer page rule update which can be triggered later.
	 */
	private deferUpdate(page: RulePage): void {
		if (this.hasDeferredUpdate === true) return;
		if (this.hasDeferredUpdate === false)
			this.hasDeferredUpdate = page;
		else if (this.hasDeferredUpdate !== page)
			this.hasDeferredUpdate = true;
	}

	/**
	 * Map the rules and update their reactive state.
	 */
	private buildRules(): void {
		this.fileRules.forEach(rule => {
			rule.judger = createJudger(this.app, rule);
			this.fileRuleMap[rule.id] = rule;
			if (rule.judger.reactive) this.#fileRuleReactive = true;
		});

		this.folderRules.forEach(rule => {
			rule.judger = createJudger(this.app, rule);
			this.folderRuleMap[rule.id] = rule;
		});
	}

	/**
	 * Update current file rule reactive state.
	 */
	private updateReactivity(): void {
		this.#fileRuleReactive = this.fileRules.some(
			rule => rule.enabled && !!rule.judger?.reactive
		);
	}

	/**
	 * Get qualified files/folders corresponding to the given rule.
	 * @param updateJudger If true, recreate the judger. It would still
	 * recreate a new judger if the rule isn't attached to any judger.
	 */
	public static qualify(app: App, rule: RuleItem, updateJudger?: boolean): TAbstractFile[] {
		let files: TAbstractFile[] = rule.page === 'file'
			? app.vault.getFiles()
			: app.vault.getAllFolders();
		
		if (updateJudger || !rule.judger)
			rule.judger = createJudger(app, rule);

		return files.filter(file => !!rule.judger?.(file));
	}

	/**
	 * Compares equality between two rules.
	 */
	public static eq(a: RuleItem, b: RuleItem): boolean {
		return (
			a === b ||
			a.id === b.id &&
			a.icon === b.icon &&
			a.enabled === b.enabled &&
			a.match === b.match &&
			a.page === b.page && (
				a.conditions === b.conditions ||
				a.conditions.length === b.conditions.length &&
				a.conditions.every((aCond, idx) => {
					let bCond = b.conditions[idx];
					if (!bCond) return false;
					return (
						aCond === bCond ||
						aCond.operator === bCond.operator &&
						aCond.source === bCond.source &&
						aCond.value === bCond.value
					);
				})
			)
		);
	}
}