import { App, Component, ExtraButtonComponent, ToggleComponent } from 'obsidian';
import { ModalEx, SettingEx } from '../../@external/obsidian-plugin-helper/src/obsidian';
import { RuleItem, RulePage } from '../../model/rule';
import { setIconWithColor } from '../../utils/icon-utils';
import Locales from '../../locales';
import IconicPlugin from '../../main';
import RuleEditor from '../rule-editor';

export default class RuleSetting extends SettingEx {
	private readonly app: App;
	private readonly plugin: IconicPlugin;
	private readonly parent: Component | ModalEx;

	// Components
	private iconBtn: ExtraButtonComponent;
	private ruleToggle: ToggleComponent;

	public readonly page: RulePage;
	public readonly rule: RuleItem;

	constructor(
		containerEl: HTMLElement,
		parent: Component | ModalEx,
		plugin: IconicPlugin,
		rule: RuleItem
	) {
		super(containerEl);
		this.app = plugin.app;
		this.plugin = plugin;
		this.parent = parent;
		this.page = rule.page;
		this.rule = rule;
		this.setClass('iconic-rule');

		// BUTTON: Rule icon
		this.addExtraButton(btn => btn
			.setTooltip(Locales.t('iconPicker.changeIcon', { count: 1 }))
			.onClick(() => plugin.openIconPicker([{ category: 'rule', id: rule.id }], true))
			.then(({ extraSettingsEl: btnEl }) => {
				this.iconBtn = btn;
				this.settingEl.prepend(btnEl);
				btnEl.addClass('iconic-rule-icon');
				setIconWithColor(btnEl, this.rule.icon, this.rule.color);
			})
		);

		// FIELD: Rule name
		this.setName(rule.name);
		this.nameEl.addClass('iconic-rule-name');
		// Edit name when clicked
		this.nameEl.addEventListener('click', () => this.toggleEditable(true));
		// Save name when focus is lost
		this.nameEl.addEventListener('blur', () => {
			this.toggleEditable(false);
			if (this.nameEl.getText()) {
				rule.name = this.nameEl.getText();
			} else {
				this.nameEl.setText(rule.name); // Prevent untitled rules
			}
		});
		this.nameEl.addEventListener('keydown', evt => {
			if (evt.key === 'Enter') this.nameEl.blur();
		});
		this.toggleEditable(true);

		// BUTTON: Edit rule
		this.addExtraButton(btn => btn
			.setIcon('lucide-settings')
			.setTooltip(Locales.t('rulePicker.editRule'))
			.onClick(() => new RuleEditor(this.plugin, this.rule, false).open())
		);

		// TOGGLE: Enable/disable rule
		this.addToggle(toggle => toggle
			.setValue(rule.enabled)
			.then(() => this.ruleToggle = toggle)
			.onChange(value => this.plugin.ruleManager.toggleRule(
				this.page, rule.id, value, true
			))
		);

		this.parent.registerEvent(this.plugin.ruleManager.on('iconic:change', (oldRule, newRule) => {
			if (newRule.id !== this.rule.id) return;
			if (
				oldRule.icon === newRule.icon &&
				oldRule.color === newRule.color
			) return;

			let btnEl = this.iconBtn.extraSettingsEl,
				{ color, icon } = newRule;
			setIconWithColor(btnEl, icon, color);
		}));
	}

	private toggleEditable(value: boolean) {
		if (value) this.nameEl.contentEditable = 'true';
		else this.nameEl.removeAttribute('contenteditable');

		// Select text if element isn't focused already
		if (value && !this.nameEl.isActiveElement()) {
			this.nameEl.focus();
			this.nameEl.doc.getSelection()?.selectAllChildren(this.nameEl);
		}
	}
}