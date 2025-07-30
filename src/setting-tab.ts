import { ExtraButtonComponent, Platform } from 'obsidian';
import { SettingManager, SettingTabEx } from './@external/obsidian-plugin-helper/src/obsidian';
import Locales from './locales';
import IconicPlugin from './main';
import IconicSettings from './model/settings';

const PLATFORM_OPTS = {
	on: Locales.t('settings.values.on'),
	desktop: Locales.t('settings.values.desktop'),
	mobile: Locales.t('settings.values.mobile'),
	off: Locales.t('settings.values.off')
}

const COLOR_PICKER_OPTS = {
	list: Locales.t('settings.values.list'),
	rgb: Locales.t('settings.values.rgb')
}

/**
 * Exposes UI settings for the plugin.
 */
export default class IconicSettingTab extends SettingTabEx {
	private readonly plugin: IconicPlugin;
	private readonly settingManager: SettingManager<IconicPlugin>;
	private readonly settings: IconicSettings;

	private indicators: Record<string, ExtraButtonComponent>;

	constructor(plugin: IconicPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.settingManager = plugin.settingManager;
		this.settings = plugin.settings;
		this.indicators = {};
	}

	public hide(): void {
		super.hide();
		this.settingManager.save();
	}

	public display(): void {
		// Rules
		this.addSetting(setting => setting
			.setName(Locales.t('settings.rulebook.name'))
			.setDesc(Locales.t('settings.rulebook.desc'))
			.addButton(btn => btn
				.setButtonText(Locales.t('settings.rulebook.manage'))
				.onClick(() => this.plugin.openRulePicker())
			)
		);

		// HEADING: Icon behavior
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingIconBehavior'))
			.setHeading()
		);

		// Bigger icons
		this.addSetting(setting => setting
			.setName(Locales.t('settings.biggerIcons.name'))
			.setDesc(Locales.t('settings.biggerIcons.desc'))
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.biggerIcons = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(PLATFORM_OPTS)
				.setValue(this.settings.biggerIcons)
				.onChange(value => {
					this.settingManager.commit('biggerIcons', value);
					this.refreshIndicator('biggerIcons', dropdown.getValue());
				});
				this.refreshIndicator('biggerIcons', dropdown.getValue());
			})
		);

		// Clickable icons
		this.addSetting(setting => setting
			.setName(Locales.t(`settings.clickableIcons.name${
				Platform.isDesktop ? 'Desktop' : 'Mobile'
			}`))
			.setDesc(Locales.t(`settings.clickableIcons.desc${
				Platform.isDesktop ? 'Desktop' : 'Mobile'
			}`))
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.clickableIcons = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(PLATFORM_OPTS)
				.setValue(this.settings.clickableIcons)
				.onChange(value => {
					this.settingManager.commit('clickableIcons', value);
					this.refreshIndicator('clickableIcons', dropdown.getValue());
				});
				this.refreshIndicator('clickableIcons', dropdown.getValue());
			})
		);

		// Show all file icons
		this.addSetting(setting => setting
			.setName(Locales.t('settings.showAllFileIcons.name'))
			.setDesc(Locales.t('settings.showAllFileIcons.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.showAllFileIcons)
				.onChange(value => this.settingManager.commit('showAllFileIcons', value))
			)
		);

		// Show all folder icons
		this.addSetting(setting => setting
			.setName(Locales.t('settings.showAllFolderIcons.name'))
			.setDesc(Locales.t('settings.showAllFolderIcons.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.showAllFolderIcons)
				.onChange(value => this.settingManager.commit('showAllFolderIcons', value))
			)
		);

		// Minimal folder icons
		this.addSetting(setting => setting
			.setName(Locales.t('settings.minimalFolderIcons.name'))
			.setDesc(Locales.t('settings.minimalFolderIcons.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.minimalFolderIcons)
				.onChange(value => this.settingManager.commit('minimalFolderIcons', value))
			)
		);

		// HEADING: Menu & dialog
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingMenuAndDialogs'))
			.setHeading()
		);

		// Show menu actions
		this.addSetting(setting => setting
			.setName(Locales.t('settings.showMenuActions.name'))
			.setDesc(Locales.t('settings.showMenuActions.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.showMenuActions)
				.onChange(value => this.settingManager.commit('showMenuActions', value))
			)
		);

		// Show icons at suggest
		this.addSetting(setting => setting
			.setName(Locales.t('settings.showIconsAtSuggest.name'))
			.setDesc(Locales.t('settings.showIconsAtSuggest.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.showIconsAtSuggest)
				.onChange(value => this.settingManager.commit('showIconsAtSuggest', value))
			)
		);

		// HEADING: Editor
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingEditor'))
			.setHeading()
		);

		// Show shortcode suggest
		this.addSetting(setting => setting
			.setName(Locales.t('settings.shortCodeSuggest.name'))
			.setDesc(Locales.t('settings.shortCodeSuggest.desc'))
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.shortCodeSuggest = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(PLATFORM_OPTS)
				.setValue(this.settings.shortCodeSuggest)
				.onChange(value => {
					this.settingManager.commit('shortCodeSuggest', value);
					this.refreshIndicator('shortCodeSuggest', dropdown.getValue());
				});
				this.refreshIndicator('shortCodeSuggest', dropdown.getValue());
			})
		);

		// HEADING: Icon property
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingIconProperty'))
			.setHeading()
		);

		// Use property
		this.addSetting(setting => setting
			.setName(Locales.t('settings.useProperty.name'))
			.setDesc(Locales.t('settings.useProperty.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.useProperty)
				.onChange(value => this.settingManager.commit('useProperty', value))
			)
		);
		
		// Property for icon
		this.addSetting(setting => setting
			.setName(Locales.t('settings.iconProperty.name'))
			.setDesc(Locales.t('settings.iconProperty.desc'))
			.addText(text => text
				.setValue(this.settings.iconProperty)
				.onChange(value => this.settingManager.commit('iconProperty', value))
			)
		);

		// Property for color
		this.addSetting(setting => setting
			.setName(Locales.t('settings.colorProperty.name'))
			.setDesc(Locales.t('settings.colorProperty.desc'))
			.addText(text => text
				.setValue(this.settings.colorProperty)
				.onChange(value => this.settingManager.commit('colorProperty', value))
			)
		);

		// HEADING: Icon picker
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingIconPicker'))
			.setHeading()
		);

		// Show item name
		this.addSetting(setting => setting
			.setName(Locales.t('settings.showItemName.name'))
			.setDesc(Locales.t('settings.showItemName.desc'))
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.showItemName = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(PLATFORM_OPTS)
				.setValue(this.settings.showItemName)
				.onChange(value => {
					this.refreshIndicator('showItemName', value);
					this.settingManager.commit('showItemName', value);
				});
				this.refreshIndicator('showItemName', dropdown.getValue());
			})
		);

		// Max search results
		this.addSetting(setting => setting
			.setName(Locales.t('settings.maxSearchResults.name'))
			.setDesc(Locales.t('settings.maxSearchResults.desc'))
			.addSlider(slider => slider
				.setLimits(10, 300, 10)
				.setValue(this.settings.maxSearchResults)
				.setDynamicTooltip()
				.onChange(value => this.settingManager.commit('maxSearchResults', value))
			)
		);

		// Main color picker
		this.addSetting(setting => setting
			.setName(Locales.t('settings.colorPicker1.name'))
			.setDesc(Platform.isDesktop
				? Locales.t('settings.colorPicker1.descDesktop')
				: Locales.t('settings.colorPicker1.descMobile')
			)
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.colorPicker1 = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(COLOR_PICKER_OPTS)
				.setValue(this.settings.colorPicker1)
				.onChange(value => {
					this.refreshIndicator('colorPicker1', value);
					this.settingManager.commit('colorPicker1', value);
				})
				this.refreshIndicator('colorPicker1', dropdown.getValue());
			})
		);

		// Second color picker
		this.addSetting(setting => setting
			.setName(Locales.t('settings.colorPicker2.name'))
			.setDesc(Platform.isDesktop
				? Locales.t('settings.colorPicker2.descDesktop')
				: Locales.t('settings.colorPicker2.descMobile')
			)
			.addExtraButton(btn => {
				btn.extraSettingsEl.addClass('iconic-indicator');
				this.indicators.colorPicker2 = btn;
			})
			.addDropdown(dropdown => { dropdown
				.addOptions(COLOR_PICKER_OPTS)
				.setValue(this.settings.colorPicker2)
				.onChange(value => {
					this.refreshIndicator('colorPicker2', value);
					this.settingManager.commit('colorPicker2', value);
				})
				this.refreshIndicator('colorPicker2', dropdown.getValue());
			})
		);

		// HEADING: Advanced
		this.addSetting(setting => setting
			.setName(Locales.t('settings.headingAdvanced'))
			.setHeading()
		);

		// Colorless hover
		this.addSetting(setting => setting
			.setName(Locales.t('settings.uncolorHover.name'))
			.setDesc(Locales.t('settings.uncolorHover.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.uncolorHover)
				.onChange(value => this.settingManager.commit('uncolorHover', value))
			)
		);

		// Colorless drag
		this.addSetting(setting => setting
			.setName(Locales.t('settings.uncolorDrag.name'))
			.setDesc(Locales.t('settings.uncolorDrag.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.uncolorDrag)
				.onChange(value => this.settingManager.commit('uncolorDrag', value))
			)
		);

		// Colorless selection
		this.addSetting(setting => setting
			.setName(Locales.t('settings.uncolorSelect.name'))
			.setDesc(Locales.t('settings.uncolorSelect.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.uncolorSelect)
				.onChange(value => this.settingManager.commit('uncolorSelect', value))
			)
		);

		// Colorless ribbon buttonn
		this.addSetting(setting => setting
			.setName(Locales.t('settings.uncolorQuick.name'))
			.setDesc(Locales.t('settings.uncolorQuick.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.uncolorQuick)
				.onChange(value => this.settingManager.commit('uncolorQuick', value))
			)
		);

		// Remember icons of deleted items
		this.addSetting(setting => setting
			.setName(Locales.t('settings.rememberDeletedItems.name'))
			.setDesc(Locales.t('settings.rememberDeletedItems.desc'))
			.addToggle(toggle => toggle
				.setValue(this.settings.rememberDeletedItems)
				.onChange(value => this.settingManager.commit('rememberDeletedItems', value))
			)
		);
	}

	/**
	 * Change a dropdown indicator icon.
	 */
	private refreshIndicator(indicatorID: string, value: string): void {
		let indicator = this.indicators[indicatorID];
		if (!indicator) return;

		switch (value) {
			case 'desktop': indicator.setIcon('lucide-monitor'); break;
			case 'mobile': indicator.setIcon('lucide-tablet-smartphone'); break;
			case 'list': indicator.setIcon('lucide-paint-bucket'); break;
			case 'rgb': indicator.setIcon('lucide-pipette'); break;
			default: indicator.extraSettingsEl.hide(); return;
		}
		indicator.extraSettingsEl.show();
	}
}