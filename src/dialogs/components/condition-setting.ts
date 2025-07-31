import { App, DropdownComponent, ExtraButtonComponent, Platform, TextComponent } from 'obsidian';
import {
	BOOL_OPERATORS,
	DATE_OPERATORS,
	DATETIME_OPERATORS,
	FILE_SOURCES,
	FOLDER_SOURCES,
	LIST_OPERATORS,
	MONTHS,
	NUMBER_OPERATORS,
	PROP_OPERATORS,
	SOURCE_OPERATOR_MAP,
	TEXT_OPERATORS,
	VALUE_OPERATORS,
	WEEKDAYS
} from '../../constants/rule';
import { SettingEx } from '../../@external/obsidian-plugin-helper/src/obsidian';
import { RuleCondition, RulePage } from '../../model/rule';
import Locales from '../../locales';
import IconicPlugin from '../../main';

export default class ConditionSetting extends SettingEx {
	private readonly app: App;
	private readonly plugin: IconicPlugin;

	public readonly page: RulePage;
	public readonly condition: RuleCondition;

	public sourceContainer: HTMLElement;
	public valContainer: HTMLElement;

	public removeBtn: ExtraButtonComponent;
	public srcDropdown: DropdownComponent;
	public opDropdown: DropdownComponent;
	public valField: TextComponent;
	public valDropdown: DropdownComponent;
	public valOptions?: Record<string, string>;
	public dragBtn: ExtraButtonComponent;

	private usePropertyAsSource: boolean;

	// Callbacks
	private changeCallback?: (self: ConditionSetting) => void;
	private removeCallback?: (self: ConditionSetting) => void;

	constructor(
		containerEl: HTMLElement,
		plugin: IconicPlugin,
		page: RulePage,
		condition: RuleCondition,
	) {
		super(containerEl);
		this.app = plugin.app;
		this.plugin = plugin;
		this.page = page;
		this.condition = condition;
		this.usePropertyAsSource = false;

		this.setClass('iconic-condition');
		this.infoEl.detach();

		this.sourceContainer = Platform.isPhone
			? this.controlEl.createDiv('iconic-dropdown-row')
			: this.controlEl;

		this.valContainer = Platform.isPhone
			? this.controlEl.createDiv('iconic-control-column')
			: this.controlEl;

		// BUTTON: Remove condition
		this.addExtraButton(btn => btn
			.setIcon('lucide-circle-minus')
			.setTooltip(Locales.t('ruleEditor.removeCondition'))
			.then(btn => this.removeBtn = btn)
			.onClick(() => this.handleRemoveBtnClick())
			.extraSettingsEl.setCssStyles({ color: '--color-red' })
		);

		// DROPDOWN: Source
		this.addDropdown(dropdown => dropdown
			.onChange(val => this.setSource(val))
			.then(() => {
				this.srcDropdown = dropdown;
				this.sourceContainer.append(dropdown.selectEl);
			})
		);

		// DROPDOWN: Operator
		this.addDropdown(dropdown => dropdown
			.onChange(val => this.setOperator(val as RuleCondition['operator']))
			.then(() => {
				this.opDropdown = dropdown;
				this.sourceContainer.append(dropdown.selectEl);
			})
		);

		// FIELD: Value
		this.addText(text => text
			.onChange(val => this.setValue(val))
			.then(() => {
				this.valField = text;
				this.valContainer.append(text.inputEl);
			})
		);

		// DROPDOWN: Value
		this.addDropdown(dropdown => dropdown
			.onChange(val => this.setValue(val))
			.then(() => {
				this.valDropdown = dropdown;
				this.valContainer.append(dropdown.selectEl);
			})
		);

		if (this.condition.source.startsWith('property:')) {
			this.refreshPropertyDropdowns();
		} else {
			this.refreshDropdowns();
		}
	}

	/**
	 * Add a callback called after making change(s) to the condition.
	 */
	public onChange(cb: (self: this) => unknown): this {
		this.changeCallback = cb;
		return this;
	}

	/**
	 * Add a callback called after removing the setting.
	 */
	public onRemove(cb: (self: this) => unknown): this {
		this.removeCallback = cb;
		return this;
	}

	/**
	 * Set condition source.
	 */
	private setSource(source: string): void {
		this.condition.source = source;
		if (source === 'properties' || source.startsWith('property:')) {
			this.refreshPropertyDropdowns();
		} else {
			this.refreshDropdowns();
		}
	}

	/**
	 * Set condition operator.
	 */
	private setOperator(operator: RuleCondition['operator']): void {
		this.condition.operator = operator;
		this.refreshValueField();
	}

	/**
	 * Set comparison value of the condition.
	 */
	private setValue(value: string): void {
		this.condition.value = value;
		this.changeCallback?.(this);
	}

	/**
	 * Remove the setting and invoke `removeCallback()`.
	 */
	private detach(): void {
		this.settingEl.detach();
		this.removeCallback?.(this);
	}

	/**
	 * Handle remove button click event.
	 */
	private handleRemoveBtnClick(): void {
		if (this.usePropertyAsSource) {
			this.removeBtn.setIcon('lucide-circle-minus');
			this.removeBtn.setTooltip(Locales.t('ruleEditor.removeCondition'));
			this.condition.source = 'name';
			this.condition.operator = 'is';
			this.refreshDropdowns();
		} else {
			this.detach();
		}
	}

	/**
	 * Refresh dropdowns to handle a normal source.
	 */
	private refreshDropdowns(): void {
		// Update sources
		let srcOptions: Record<string, string> = this.page === 'file'
			? FILE_SOURCES
			: FOLDER_SOURCES;

		this.srcDropdown.selectEl.empty();
		this.srcDropdown.addOptions(srcOptions);
		// If selected source is invalid, select the default
		if (!srcOptions[this.condition.source]) {
			this.condition.source = this.srcDropdown.getValue();
		}
		// Update selection
		this.srcDropdown.setValue(this.condition.source);

		// Update operators
		let opOptions = SOURCE_OPERATOR_MAP[this.condition.source];
		this.opDropdown.selectEl.empty();
		this.opDropdown.addOptions(opOptions ?? {});
		// If selected operator is invalid, select the default
		if (!opOptions[this.condition.operator]) {
			this.condition.operator = this.opDropdown.getValue() as RuleCondition['operator'];
		}
		// Update selection
		this.opDropdown.setValue(this.condition.operator);

		this.usePropertyAsSource = true;
		this.refreshValueField();
	}

	/**
	 * Refresh dropdowns to handle a property source.
	 */
	private refreshPropertyDropdowns(): void {
		// Change remove icon
		this.removeBtn.setIcon('lucide-archive');
		this.removeBtn.setTooltip(Locales.t('ruleEditor.resetCondition'));

		// Update sources
		let props = this.app.metadataTypeManager.types,
			srcOptions: Record<string, string> = {};
		for (let prop in props) {
			srcOptions[`property:${prop}`] = prop;
		}

		this.srcDropdown.selectEl.empty();
		this.srcDropdown.addOptions(srcOptions);

		// Update selected source
		this.condition.source = srcOptions[this.condition.source]
			? this.condition.source
			: this.srcDropdown.getValue();
		this.srcDropdown.setValue(this.condition.source);

		// Update operators
		let propName = this.condition.source.replace(/^property:/, ''),
			propType = props[propName]?.type;
		if (!propName || !propType) return;

		let opOptions: Record<string, string> = {};
		switch (propType) {
			case 'multitext': opOptions = LIST_OPERATORS; break;
			case 'number': opOptions = NUMBER_OPERATORS; break;
			case 'checkbox': opOptions = BOOL_OPERATORS; break;
			case 'aliases': opOptions = LIST_OPERATORS; break;
			case 'tags': opOptions = LIST_OPERATORS; break;
			case 'date': opOptions = DATE_OPERATORS; break;
			case 'datetime': opOptions = DATETIME_OPERATORS; break;
			default: opOptions = TEXT_OPERATORS; break;
		}
		opOptions = Object.assign({}, opOptions, VALUE_OPERATORS, PROP_OPERATORS);
		this.opDropdown.selectEl.empty();
		this.opDropdown.addOptions(opOptions);

		// Update selected operator
		this.condition.operator = opOptions[this.condition.operator]
			? this.condition.operator
			: this.opDropdown.getValue() as RuleCondition['operator'];;
		this.opDropdown.setValue(this.condition.operator);

		this.usePropertyAsSource = false;
		this.refreshValueField();
	}

	/**
	 * Refresh the value field to match the operator value type.
	 */
	private refreshValueField(): void {
		let isFirstRefresh = !this.valField.getValue(),
			operator = this.condition.operator,
			valType: string = '',
			valPlaceholder = '',
			valOptions: Record<string, string> | undefined;
		
		if (/less|greater|equal|divisible|year|monthday/i.test(operator)) {
			valType = 'number';
			valPlaceholder = Locales.t('ruleEditor.enterNumber');
		} else if (/false|true|empty|exist/i.test(operator)) {
			valType = 'boolean';
		} else if (/datetime/i.test(operator)) {
			valType = 'datetime-local';
		} else if (/date/i.test(operator)) {
			valType = 'date';
		} else if (/time/i.test(operator)) {
			valType = 'time';
		} else if (/weekday/i.test(operator)) {
			valOptions = WEEKDAYS;
		} else if (/month/i.test(operator)) {
			valOptions = MONTHS;
		} else {
			valType = 'text';
			if (/match/i.test(operator)) valPlaceholder = Locales.t('ruleEditor.enterRegex');
		}

		if (valType && valType !== 'boolean') {
			// If input type or visibility have changed, reset the value
			if ((valType !== this.valField.inputEl.type || !this.valField.inputEl.isShown()) && !isFirstRefresh) {
				this.condition.value = '';
			}
			this.valField.inputEl.type = valType;
			this.valField.setPlaceholder(valPlaceholder);
			this.valField.setValue(this.condition.value);
			this.valField.inputEl.show();
		} else {
			this.valField.inputEl.hide();
		}

		if (valOptions) {
			// If dropdown was just created, select the saved value (if valid)
			if (!this.valOptions) {
				this.valDropdown.addOptions(valOptions);
				if (valOptions[this.condition.value]) {
					this.valDropdown.setValue(this.condition.value);
				} else {
					this.condition.value = this.valDropdown.getValue();
				}
			// If dropdown has changed, reset the saved value
			} else if (this.valOptions !== valOptions || !this.valDropdown.selectEl.isShown()) {
				this.valDropdown.selectEl.empty();
				this.valDropdown.addOptions(valOptions);
				this.condition.value = this.valDropdown.getValue();
			}
			this.valOptions = valOptions;
			this.valDropdown.selectEl.show();
		} else {
			this.valDropdown.selectEl.hide();
		}

		this.changeCallback?.(this);
	}
}