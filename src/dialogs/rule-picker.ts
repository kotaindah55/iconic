import { prepareFuzzySearch, SearchComponent, SearchResult } from 'obsidian';
import { ModalEx, SettingEx, SortableList } from '../@external/obsidian-plugin-helper/src/obsidian';
import { RuleItem, RulePage } from '../model/rule';
import IconicPlugin from '../main';
import Locales from '../locales';
import IconicSettings from '../model/settings';
import RuleSetting from './components/rule-setting';
import RuleManager from '../ruler/rule-manager';

const PAGE_OPTIONS = {
	file: Locales.t('rulePicker.fileRules'),
	folder: Locales.t('rulePicker.folderRules'),
};

const COLLATOR = new Intl.Collator(undefined, { numeric: true, caseFirst: 'false' });

export default class RulePicker extends ModalEx {
	private readonly plugin: IconicPlugin;
	private readonly state: IconicSettings['dialogState'];
	private readonly ruleManager: RuleManager;

	private headingSetting: SettingEx;
	private searchField: SearchComponent;

	private selectPageSetting: SettingEx;
	private addRuleSetting: SettingEx;
	private ruleList: SortableList<RuleSetting>;

	private searchQuery: string | null;
	private searchResult: RuleSetting[];

	private get page(): RulePage {
		return this.state.rulePage;
	}
	private set page(page: RulePage) {
		this.state.rulePage = page;
		this.plugin.requestSave();
	}

	public searchMode: boolean;

	constructor(plugin: IconicPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.state = plugin.settings.dialogState;
		this.ruleManager = plugin.ruleManager;
		this.searchMode = false;
		this.searchQuery = null;
		this.searchResult = [];

		this.draw();
	}

	public override onOpen(): void {
		this.listRules();

		this.registerEvent(this.ruleManager.on('iconic:add', rule => {
			if (rule.page !== this.page) return;
			if (this.searchMode) this.stopSearch();
			this.ruleList.addSetting(new RuleSetting(this.ruleList.listEl, this, this.plugin, rule));
		}));

		this.registerEvent(this.ruleManager.on('iconic:delete', deletedRule => {
			if (deletedRule.page !== this.page) return;
			let targetSetting = this.ruleList.settings.find(
				({ rule }) => rule.id === deletedRule.id
			);
			if (targetSetting) this.ruleList.removeSetting(targetSetting);
		}));
	}

	public override onClose(): void {
		this.ruleManager.triggerDeferredUpdate();
	}

	public addNewRuleAfter(setting: RuleSetting): void {
		if (setting.rule.page != this.page || this.searchMode) return;

		let idx = this.getIndex(setting);
		if (idx < 0) return;
		this.addNewRule(idx + 1, setting.rule.page);
	}

	public duplicateRule(setting: RuleSetting): void {
		if (setting.rule.page != this.page || this.searchMode) return;

		let idx = this.getIndex(setting);
		if (idx < 0) return;

		let ruleSpec = RuleManager.getRuleSpec(setting.rule),
			newRule = this.ruleManager.addRule(setting.rule.page, ruleSpec);

		this.ruleManager.moveRule(setting.rule.page, newRule.id, idx + 1);
		this.ruleList.moveSetting(this.ruleList.settings.last()!, idx + 1);
	}

	public removeRule(setting: RuleSetting): void {
		let { page, id } = setting.rule;
		this.ruleManager.deleteRule(page, id);
	}

	private draw(): void {
		this.containerEl.addClass('mod-confirmation');
		this.modalEl.addClass('iconic-rule-picker');
		this.setTitle(Locales.t('settings.rulebook.name'));

		// SETTING_ROW: Page setting
		this.addSetting(setting => setting
			.setName(Locales.t('rulePicker.selectPage'))
			.then(() => this.selectPageSetting = setting)
		);

		// DROPDOWN: Select a page
		this.selectPageSetting.addDropdown(dropdown => dropdown
			.addOptions(PAGE_OPTIONS)
			.setValue(this.page)
			.onChange(val => {
				this.page = val as RulePage;
				this.listRules();
			})
		);

		// HEADING: Rules
		this.addSetting(setting => setting
			.setName(Locales.t('rulePicker.rules'))
			.setDesc(Locales.t('rulePicker.rulesDesc'))
			.setHeading()
			.then(() => this.headingSetting = setting)
		);

		// SEARCH: Search rules
		this.headingSetting.addSearch(field => field
			.setPlaceholder(Locales.t('rulePicker.search'))
			.onChange(val => this.runSearch(val))
			.then(() => this.searchField = field)
		);

		// LIST: Rules
		this.addSortableList<RuleSetting>(list => list
			.setClass('iconic-sortable-list')
			.then(() => this.ruleList = list)
			.onMove((setting, newIndex) => {
				let { id, page } = setting.rule;
				this.ruleManager.moveRule(page, id, newIndex, true);
			})
		);

		// SETTING_ROW: Add rule setting
		this.addSetting(setting => setting
			.setClass('iconic-add')
			.then(() => this.addRuleSetting = setting)
			.infoEl.detach()
		);

		// BUTTON: Add rule
		this.addRuleSetting.addExtraButton(btn => btn
			.setIcon('lucide-circle-plus')
			.setTooltip(Locales.t('rulePicker.addRule'))
			.onClick(() => this.addNewRule())
			.extraSettingsEl.addClass('mod-success')
		);
	}

	private runSearch(query: string | null): void {
		if (!query) return this.stopSearch();

		this.searchMode = true;
		this.searchQuery = query;

		if (this.addRuleSetting.settingEl.isShown())
			this.addRuleSetting.setHidden(true, true);

		let settings = this.ruleList.settings,
			search = prepareFuzzySearch(query);

		this.searchResult = settings
			.map<[SearchResult | null, RuleSetting]>(setting => [search(setting.rule.name), setting])
			.filter((result): result is [SearchResult, RuleSetting] => !!result[0])
			.sort((a, b) => {
				let nameA = a[1].rule.name,
					nameB = b[1].rule.name,
					scoreA = a[0].score,
					scoreB = b[0].score;

				return scoreB - scoreA || COLLATOR.compare(nameA, nameB);
			})
			.map(result => result[1]);

		this.showSearchResult();
	}

	private stopSearch(): void {
		this.searchMode = false;
		this.searchQuery = null;
		this.searchResult.splice(0);

		this.addRuleSetting.setHidden(false);
		
		this.ruleList.setDisabled(false);
		this.ruleList.listEl.empty();
		this.ruleList.settings.forEach(setting => this.ruleList.listEl.append(setting.settingEl));
	}

	private showSearchResult(): void {
		if (!this.searchMode) return;

		this.ruleList.listEl.empty();
		this.ruleList.setDisabled(true);
		this.searchResult.forEach(setting => this.ruleList.listEl.append(setting.settingEl));
	}

	private listRules(): void {
		let rules = this.ruleManager.getRules(this.page);
		this.ruleList.clear();

		rules.forEach(rule => this.ruleList.addSetting(
			new RuleSetting(this.ruleList.listEl, this, this.plugin, rule)
		));

		if (this.searchMode) this.runSearch(this.searchQuery);
	}

	private addNewRule(idx?: number, page: RulePage = this.page): void {
		let lastIdx = this.ruleManager.getRules(page).length;
		idx = Math.clamp(idx ?? lastIdx, 0, lastIdx);

		let rule = this.ruleManager.addRule(this.page, {
			name: 'Untitled rule',
			icon: page == 'file' ? 'lucide-file' : 'lucide-folder',
			match: 'all',
			conditions: []
		});

		this.ruleManager.moveRule(page, rule.id, idx);

		if (rule.page != this.page) return;

		this.ruleList.moveSetting(this.ruleList.settings.last()!, idx);
	}

	private getIndex(settingOrRule: RuleSetting | RuleItem): number {
		return this.ruleList.settings.findIndex(setting => {
			return settingOrRule instanceof RuleSetting
				? setting == settingOrRule
				: setting.rule == settingOrRule;
		});
	}
}