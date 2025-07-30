import { debounce, Debouncer, Platform, Setting, TextComponent } from 'obsidian';
import { ButtonExComponent, ModalEx, SettingEx, SortableList } from '../@external/obsidian-plugin-helper/obsidian';
import { RuleCondition, RuleItem, RulePage } from '../model/rule';
import { setIconWithColor } from '../utils/icon-utils';
import IconicPlugin from '../main';
import Locales from '../locales';
import ConditionSetting from './components/condition-setting';
import createJudger from '../ruler/judger';
import RuleChecker from './rule-checker';

export default class RuleEditor extends ModalEx {
	private readonly plugin: IconicPlugin;
	private readonly triggerOnClose: boolean;

	// Rule
	private readonly page: RulePage;
	private readonly rule: RuleItem;

	// Components
	private ruleSetting: SettingEx;
	private nameField: TextComponent;

	private matchSetting: SettingEx;
	private matchBtnMap: Record<string, ButtonExComponent>;
	
	private addCondSetting: Setting;
	private conditionList: SortableList;

	private requestUpdateJudger: Debouncer<[], unknown>;

	constructor(plugin: IconicPlugin, rule: RuleItem, triggerOnClose = true) {
		super(plugin.app);
		this.plugin = plugin;
		this.page = rule.page;
		this.requestUpdateJudger = debounce(() => this.updateJudger(), 100);
		this.triggerOnClose = triggerOnClose;

		rule = Object.assign({}, rule);
		delete rule.judger;
		this.rule = this.modalEl.win.structuredClone(rule);

		this.draw();

		this.scope.register([], 'Enter', () => {
			if (!this.nameField.inputEl.isActiveElement()) return;
			this.closeAndSave();
		});
	}

	public override onOpen(): void {
		this.rule.conditions.forEach(cond => this.addCondition(cond));
	}

	public override onClose(): void {
		super.onClose();
		this.conditionList.abort();
		if (this.triggerOnClose)
			this.plugin.ruleManager.triggerDeferredUpdate();
	}

	/**
	 * Draw required components inside the modal.
	 */
	private draw(): void {
		this.containerEl.addClass('mod-confirmation');
		this.modalEl.addClass('iconic-rule-editor');
		this.setTitle(Locales.t(`ruleEditor.${this.page}Rule`));

		// SETTING_ROW: Rule setting
		this.addSetting(setting => setting
			.then(() => this.ruleSetting = setting)
			.infoEl.detach()
		);

		// BUTTON: Rule icon
		this.ruleSetting.addExtraButton(btn => btn
			.setTooltip(Locales.t('iconPicker.changeIcon', { count: 1 }))
			.onClick(() => this.plugin.openIconPicker([{ category: 'rule', id: this.rule.id }]))
			.then(() => setIconWithColor(btn.extraSettingsEl, this.rule.icon, this.rule.color))
			.extraSettingsEl.addClass('iconic-rule-icon')
		);

		// FIELD: Rule name
		this.ruleSetting.addText(text => text
			.setValue(this.rule.name)
			.setPlaceholder(Locales.t('ruleEditor.enterName'))
			.then(() => this.nameField = text)
		);

		// TOGGLE: Enable/disable rule
		this.ruleSetting.addToggle(toggle => toggle
			.setValue(this.rule.enabled)
			.onChange(value => this.rule.enabled = value)
		);

		// SETTING_ROW: Match setting
		this.addSetting(setting => setting
			.setName(Locales.t('ruleEditor.matchConditions.name'))
			.setDesc(Locales.t('ruleEditor.matchConditions.desc'))
			.then(() => this.matchSetting = setting)
		);

		// BUTTON: All
		this.matchSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.matchConditions.all'))
			.setTooltip(Locales.t('ruleEditor.matchConditions.allTooltip'))
			.toggleCta(this.rule.match === 'all')
			.onClick(() => this.setMatch('all'))
			.then(() => this.matchBtnMap['all'] = btn)
		);

		// BUTTON: Any
		this.matchSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.matchConditions.any'))
			.setTooltip(Locales.t('ruleEditor.matchConditions.anyTooltip'))
			.toggleCta(this.rule.match === 'any')
			.onClick(() => this.setMatch('any'))
			.then(() => this.matchBtnMap['any'] = btn)
		);

		// BUTTON: None
		this.matchSetting.addButtonEx(btn => btn
			.setButtonText(Locales.t('ruleEditor.matchConditions.none'))
			.setTooltip(Locales.t('ruleEditor.matchConditions.noneTooltip'))
			.toggleCta(this.rule.match === 'none')
			.onClick(() => this.setMatch('none'))
			.then(() => this.matchBtnMap['none'] = btn)
		);

		// HEADING: Conditions
		this.addSetting(setting => setting
			.setName(Locales.t('ruleEditor.conditions'))
			.setHeading()
		);

		// SETTING_LIST: Conditions
		this.addSortableList(list => list
			.onAdd((setting: ConditionSetting) => {
				this.rule.conditions.push(setting.condition);
				this.requestUpdateJudger();
			})
			.onRemove((setting: ConditionSetting) => {
				this.rule.conditions.remove(setting.condition);
				this.requestUpdateJudger();
			})
			.onMove((_, newIndex, oldIndex) => {
				let targetCond = this.rule.conditions.splice(oldIndex, 1);
				this.rule.conditions.splice(newIndex, 0, ...targetCond);
				this.requestUpdateJudger();
			})
			.then(() => this.conditionList = list)
		);

		// SETTING_ROW: Add condition
		this.addSetting(setting => setting
			.setClass('iconic-add')
			.then(() => this.addCondSetting = setting)
			.infoEl.detach()
		);

		// BUTTON: Add condition
		this.addCondSetting.addExtraButton(btn => btn
			.setIcon('lucide-circle-plus')
			.setTooltip(Locales.t('ruleEditor.addCondition'))
			.onClick(() => this.addCondition())
			.extraSettingsEl.addClass('mod-success')
		);

		// [Remove rule]
		this.addButton(btn => btn
			.setButtonText(Locales.t('ruleEditor.removeRule'))
			.toggleDestrcutive(!Platform.isPhone)
			.toggleWarning(Platform.isPhone)
			.onClick(() => this.removeSelf()),
		{ secondary: true });

		// [Check matches]
		this.addButton(btn => btn
			.setButtonText(Locales.t('ruleEditor.buttonMatch'))
			.onClick(() => new RuleChecker(this.plugin, this.rule).open())
		);

		// [Cancel]
		this.addButton(btn => btn
			.setButtonText(Locales.t('iconPicker.cancel'))
			.toggleCancel(!Platform.isPhone)
			.onClick(() => this.close()),
		{ asNav: Platform.isPhone, secondary: Platform.isPhone });

		// [Save]
		this.addButton(btn => btn
			.setButtonText(Locales.t('iconPicker.save'))
			.setCta()
			.toggleCancel(!Platform.isPhone)
			.onClick(() => this.closeAndSave()),
		{ asNav: Platform.isPhone });
	}

	/**
	 * Set match condition to the rule.
	 */
	private setMatch(match: 'all' | 'any' | 'none'): void {
		this.rule.match = match;
		this.requestUpdateJudger();

		for (let key in this.matchBtnMap)
			this.matchBtnMap[key].toggleCta(key == match);
	}

	/**
	 * Update the rule judger.
	 */
	private updateJudger(): void {
		this.rule.judger = createJudger(this.app, this.rule);
	}

	/**
	 * Add condition and append it to the rule. If `cond` is not specified,
	 * it will create a new one.
	 */
	private addCondition(cond?: RuleCondition): void {
		cond ??= { source: 'name', operator: 'is', value: '' };
		this.conditionList.addSetting(
			ConditionSetting, [this.conditionList.listEl, this.plugin, this.page, cond],
			(setting: ConditionSetting, list) => setting
				.onChange(() => this.requestUpdateJudger())
				.onRemove(() => list.removeSetting(setting))
		);
	}

	/**
	 * Remove the given {@link cond | condition} from the rule.
	 */
	private removeCondition(cond: RuleCondition): void {
		this.conditionList.settings.some(setting => {
			if (!(setting instanceof ConditionSetting)) return false;
			if (cond !== setting.condition) return false;
			this.conditionList.removeSetting(setting);
			return true;
		});
	}

	/**
	 * Remove attached rule from the rule manager and close the modal.
	 */
	private removeSelf(): void {
		this.plugin.ruleManager.deleteRule(this.page, this.rule.id, true);
		this.close();
	}

	/**
	 * Save the rule to the rule manager and close this dialog.
	 */
	private closeAndSave(): void {
		this.plugin.ruleManager.editRule(this.page, this.rule.id, this.rule, true);
		this.close();
	}
}