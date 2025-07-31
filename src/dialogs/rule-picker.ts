import { ModalEx, SettingEx, SortableList } from '../@external/obsidian-plugin-helper/src/obsidian';
import { RulePage } from '../model/rule';
import IconicPlugin from '../main';
import Locales from '../locales';
import IconicSettings from '../model/settings';
import RuleSetting from './components/rule-setting';
import RuleManager from '../ruler/rule-manager';

const PAGE_OPTIONS = {
	file: Locales.t('rulePicker.fileRules'),
	folder: Locales.t('rulePicker.folderRules'),
};

export default class RulePicker extends ModalEx {
	private readonly plugin: IconicPlugin;
	private readonly state: IconicSettings['dialogState'];
	private readonly ruleManager: RuleManager;

	private selectPageSetting: SettingEx;
	private addRuleSetting: SettingEx;
	private ruleList: SortableList;

	get page(): RulePage {
		return this.state.rulePage;
	}
	set page(page: RulePage) {
		this.state.rulePage = page;
		this.plugin.requestSave();
	}

	constructor(plugin: IconicPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.state = plugin.settings.dialogState;
		this.ruleManager = plugin.ruleManager;

		this.draw();
	}

	public override onOpen(): void {
		this.listRules();

		this.registerEvent(this.ruleManager.on('iconic:add', rule => {
			if (rule.page !== this.page) return;
			this.ruleList.addSetting(RuleSetting, [
				this.ruleList.listEl, this, this.plugin, rule
			]);
		}));

		this.registerEvent(this.ruleManager.on('iconic:delete', deletedRule => {
			if (deletedRule.page !== this.page) return;
			let targetSetting = this.ruleList.settings.find(
				({ rule }: RuleSetting) => rule.id === deletedRule.id
			);
			if (targetSetting) this.ruleList.removeSetting(targetSetting);
		}));
	}

	public override onClose(): void {
		this.ruleManager.triggerDeferredUpdate();
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
			.setHeading()
		);

		// LIST: Rules
		this.addSortableList(list => list
			.setClass('iconic-sortable-list')
			.then(() => this.ruleList = list)
			.onMove((setting: RuleSetting, newIndex) => {
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
			.onClick(() => this.addRule())
			.extraSettingsEl.addClass('mod-success')
		);
	}

	private listRules(): void {
		let ruleMap = this.ruleManager.getRules(this.page);
		this.ruleList.clear();

		for (let id in ruleMap) this.ruleList.addSetting(
			RuleSetting,
			[this.ruleList.listEl, this, this.plugin, ruleMap[id]]
		);
	}

	private addRule(): void {
		this.ruleManager.addRule(this.page, {
			name: 'Untitled rule',
			icon: 'lucide-file',
			match: 'all',
			conditions: []
		});
	}
}