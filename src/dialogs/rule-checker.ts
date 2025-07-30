import { ButtonExComponent, isFile, ModalEx, SettingEx } from '../@external/obsidian-plugin-helper/obsidian';
import { Tasker } from '../@external/obsidian-plugin-helper/global';
import { RuleItem } from '../model/rule';
import Locales from '../locales';
import IconicPlugin from '../main';
import RuleManager from '../ruler/rule-manager';

/**
 * Displays list of file that matches the rule.
 */
export default class RuleChecker extends ModalEx {
	private readonly plugin: IconicPlugin;
	private readonly rule: RuleItem;
	private readonly tasker: Tasker;

	/**
	 * Current highlighted part.
	 */
	private highlighted: 'parent' | 'name' | 'extension';
	private highlightSetting: SettingEx;
	private highlightBtnMap: Record<string, ButtonExComponent>;

	private listEl: HTMLOListElement;

	constructor(plugin: IconicPlugin, rule: RuleItem) {
		super(plugin.app);
		this.plugin = plugin;
		this.rule = rule;
		this.tasker = new Tasker();

		this.highlighted = 'parent';
		this.highlightBtnMap = {};

		this.draw();
	}

	public override onOpen(): void {
		let qualifiedFiles = RuleManager.qualify(this.app, this.rule);

		this.setTitle(Locales.t(`ruleChecker.${this.rule.page}Match`, { count: qualifiedFiles.length }));

		this.tasker.queue(async state => {
			for (let i = 0; i < qualifiedFiles.length; i++) {
				let file = qualifiedFiles[i],
					parent = file.parent?.path,
					basename: string,
					extension: string | undefined;

				if (isFile(file)) {
					basename = file.basename;
					extension = file.extension;
				} else {
					basename = file.name;
				}

				let liEl = this.listEl.createEl('li', 'iconic-match');
				
				if (parent) {
					if (parent == '/') parent = '';
					else parent += '/';
					liEl.createSpan({ cls: 'iconic-match-tree', text: parent });
				}
				if (basename) liEl.createSpan({ cls: 'iconic-match-name', text: basename });
				if (extension) {
					liEl.createSpan({ text: '.' });
					liEl.createSpan({ cls: 'iconic-match-extension', text: extension });
				}

				// Keep the UI responsive on vault with large number of files.
				if (i % 100 === 0) {
					// Do short circuit when needed, e.g. when closing the modal.
					if (state?.mustCancelCurrent) return;
					await sleep(10);
				}
			}
		}, 0);
	}

	public override onClose(): void {
		this.tasker.cancel();
	}

	private draw(): void {
		this.containerEl.addClass('mod-confirmation');
		this.contentEl.addClass('iconic-highlight-tree');

		// SETTING_ROW: Highlight buttons
		this.addSetting(setting => setting
			.setName(Locales.t('ruleChecker.highlight'))
			.then(() => this.highlightSetting = setting)
		);

		// BUTTON: Folder tree
		this.highlightSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.source.parent'))
			.setCta()
			.onClick(() => this.setHighlight('parent'))
			.then(() => this.highlightBtnMap['parent'] = btn)
		);

		// BUTTON: Name
		this.highlightSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.source.name'))
			.onClick(() => this.setHighlight('name'))
			.then(() => this.highlightBtnMap['name'] = btn)
		);

		// BUTTON: Extension
		this.highlightSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.source.extension'))
			.onClick(() => this.setHighlight('extension'))
			.then(() => this.highlightBtnMap['extension'] = btn)
		);

		// HEADING: Matches
		this.addSetting(setting => setting
			.setName(Locales.t('ruleChecker.headingMatches'))
			.setHeading()
		);

		this.listEl = this.contentEl.createEl('ol', 'iconic-matches');
	}

	/**
	 * Set which part of the path that should be highlighted.
	 */
	private setHighlight(part: 'parent' | 'name' | 'extension'): void {
		if (part == this.highlighted) return;

		let parts = ['parent', 'name', 'extension'].filter(p => p != part);

		this.highlighted = part;
		this.contentEl.addClass(`iconic-highlight-${part}`);
		this.contentEl.removeClasses(parts.map(p => `iconic-highlight-${p}`));

		this.highlightBtnMap[part].setCta();
		parts.forEach(p => this.highlightBtnMap[p].removeCta());
	}
}