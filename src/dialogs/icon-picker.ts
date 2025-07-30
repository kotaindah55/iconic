import {
	ColorComponent,
	debounce,
	Debouncer,
	displayTooltip,
	ExtraButtonComponent,
	Menu,
	MenuPositionDef,
	Platform,
	SearchComponent,
	Setting,
	setTooltip
} from 'obsidian';
import { CycleButtonComponent, ModalEx, SettingEx } from '../@external/obsidian-plugin-helper/obsidian';
import { handleLongPress } from '../@external/obsidian-plugin-helper/dom';
import { COLOR_KEYS } from '../constants/colors';
import { IconItemCategory } from '../model/icon-item';
import { toRgb, toRgbHex } from '../utils/color-utils';
import { setIconWithColor } from '../utils/icon-utils';
import IconSearch, { IconSearchResult } from '../search/icon-search';
import RuleManager from '../ruler/rule-manager';
import IconicPlugin from '../main';
import Locales from '../locales';
import EMOJI_SHORTNAMES from '../../data/emoji-shortnames.mjs';

export interface ItemDesc {
	category: IconItemCategory;
	id: string;
}

interface IconPickerState {
	/**
	 * Which ids and categories are going to be applied.
	 */
	items: ItemDesc[];
	/**
	 * Selected icon.
	 */
	icon?: string;
	/**
	 * Selected color.
	 */
	color?: string;
	/**
	 * Which type will be displayed in the picker.
	 */
	mode: 'icon' | 'emoji';
}

const MODE_OPTS = new Map([
	['icon', 'lucide-image'],
	['emoji', 'lucide-smile']
]);

export default class IconPicker extends ModalEx {
	public readonly plugin: IconicPlugin;
	private search: IconSearch;
	private state: IconPickerState;
	private deferRuleIcon: boolean;

	private nameSetting: SettingEx;
	private searchSetting: Setting;
	private resultsSetting: Setting;
	private colorPicker: ColorComponent;
	private colorResetBtn: ExtraButtonComponent;
	private searchField: SearchComponent;
	private modeBtn: CycleButtonComponent;
	
	private requestSearch: Debouncer<[], void>;

	private get results(): IconSearchResult[] {
		return this.search.results;
	}

	constructor(plugin: IconicPlugin, items: ItemDesc[], deferRuleIcon = false) {
		super(plugin.app);
		this.plugin = plugin;
		this.state = { items, mode: plugin.settings.dialogState.pickerMode };
		this.requestSearch = debounce(this.startSearch.bind(this), 200);
		this.deferRuleIcon = deferRuleIcon;
		this.modalEl.addClass('iconic-icon-picker');
		
		// Get selected icon and color.
		items.some(desc => {
			let iconItem = plugin.getIconItem(desc.category, desc.id);
			this.state.icon = iconItem.icon;
			this.state.color = iconItem.color;

			if (!this.state.icon) return false;

			// Select most-prefered mode.
			this.state.mode = this.state.icon in EMOJI_SHORTNAMES
				? 'emoji'
				: 'icon';
			if (plugin.settings.dialogState.pickerMode !== this.state.mode) {
				plugin.settings.dialogState.pickerMode = this.state.mode;
				plugin.requestSave();
			}
			return true;
		});

		// Initialize icon search.
		this.search = new IconSearch(plugin, this.state.mode);

		// Navigation hotkeys
		this.scope.register(null, 'ArrowUp', event => this.nudgeFocus(event));
		this.scope.register(null, 'ArrowDown', event => this.nudgeFocus(event));
		this.scope.register(null, 'ArrowLeft', event => this.nudgeFocus(event));
		this.scope.register(null, 'ArrowRight', event => this.nudgeFocus(event));
		this.scope.register(null, 'Enter', event => this.confirmFocus(event));
		this.scope.register(null, ' ', event => this.confirmFocus(event));
		this.scope.register(null, 'Delete', event => this.deleteFocus(event));
		this.scope.register(null, 'Backspace', event => this.deleteFocus(event));

		this.draw();
	}

	public override onOpen(): void {
		// Hack to guarantee initial focus
		this.win.requestAnimationFrame(() => this.searchField.inputEl.select());
		this.startSearch();
	}

	private draw(): void {
		let { items, color } = this.state,
			itemsCount = items.length;

		let showItemName = this.plugin.settings.showItemName === 'on'
			|| Platform.isDesktop && this.plugin.settings.showItemName === 'desktop'
			|| Platform.isMobile && this.plugin.settings.showItemName === 'mobile';

		let category = items.every(item => item.category === items[0].category)
			? items[0].category
			: 'item';

		this.buttonContainerEl = Platform.isPhone
			? this.buttonContainerEl.createDiv('iconic-button-row')
			: this.buttonContainerEl;

		// TITLE: Dialog title
		this.setTitle(Locales.t('menu.changeIcon', { count: itemsCount }));

		// SETTING_ROW: Item name
		this.addSetting(setting => setting
			.setName(Locales.t(`categories.${category}`, { count: itemsCount }))
			.setDisabled(true)
			.setHidden(!showItemName, true)
			.then(() => this.nameSetting = setting)
		);

		// FIELD: Item name
		this.nameSetting.addText(text => text
			.setValue(items.map(({ category, id }) => this.plugin.getItemName(category, id)).join(', '))
			.setDisabled(true)
		);

		// SETTING_ROW: Search setting
		this.addSetting(setting => setting
			.setName(Platform.isPhone ? '' : Locales.t('iconPicker.search'))
			.then(() => this.searchSetting = setting)
		);

		// BUTTON: Reset color
		this.searchSetting.addExtraButton(btn => btn
			.setIcon('lucide-rotate-ccw')
			.setTooltip(Locales.t('iconPicker.resetColor'))
			.onClick(() => this.resetColor())
			.then(() => {
				this.colorResetBtn = btn
				let btnEl = btn.extraSettingsEl;
				btnEl.addClass('iconic-reset-color');
				btnEl.tabIndex = color ? 0 : -1;
				if (!color) btnEl.hide();
			})
		);

		// COLOR_PICKER
		this.searchSetting.addColorPicker(picker => picker
			.onChange(val => this.changeColor(val))
			.then(() => {
				this.colorPicker = picker;

				// Handle horizontal scrolling.
				picker.colorPickerEl.addEventListener('wheel', evt => evt.deltaY + evt.deltaX < 0
					? this.previousColor()
					: this.nextColor(),
				{ passive: true });

				// Handle contextmenu on iOS app.
				if (Platform.isIosApp) handleLongPress(
					picker.colorPickerEl,
					evt => this.handlePickerClick(evt, false)
				);
			})
			.colorPickerEl.addEventListeners({
				click: evt => this.handlePickerClick(evt, true),
				contextmenu: evt => this.handlePickerClick(evt, false)
			})
		);

		// SETTING_ROW: Search results
		this.addSetting(setting => setting
			.setClass('iconic-search-results')
			.then(() => setting.settingEl.tabIndex = 0)
			.settingEl.addEventListener('wheel', function (evt) {
				let isRtl = this.doc.body.hasClass('mod-rtl');
				this.scrollBy({
					left: evt.deltaY * (isRtl ? -2 : 2),
					behavior: 'smooth'
				});
			}, { passive: true })
		);

		// BUTTONS: Toggle icons & emojis
		this.modeBtn = new CycleButtonComponent(this.buttonContainerEl)
			.addOptions(MODE_OPTS)
			.setDynamicTooltip(() => Locales.t('iconPicker.switchMode'))
			.setValue(this.state.mode)
			.onChange(() => this.switchMode())
			.then(btn => btn.cycleButtonEl.addClass('iconic-mode-selected'));

		// [Remove]
		if (this.state.icon || this.state.color) this.addButton(btn => btn
			.setButtonText(Locales.t('menu.removeIcon', { count: itemsCount }))
			.toggleWarning(Platform.isPhone)
			.toggleDestrcutive(!Platform.isPhone)
			.onClick(() => this.closeAndSave()),
		{ secondary: true });
		
		// [Cancel]
		this.addButton(btn => btn
			.setButtonText(Locales.t('iconPicker.cancel'))
			.setClass(Platform.isPhone ? '' : 'mod-cancel')
			.onClick(() => this.close()),
		{ asNav: Platform.isPhone, secondary: Platform.isPhone });

		// [Save]
		this.addButton(btn => btn
			.setButtonText(Locales.t('iconPicker.save'))
			.onClick(() => this.closeAndSave(this.state.icon, this.state.color)),
		{ asNav: Platform.isPhone });
	}

	/**
	 * Handle click event on color picker.
	 * 
	 * @param primary Set it true if the click is primary click (usually left
	 * click).
	 */
	private handlePickerClick(evt: MouseEvent, primary: boolean): void {
		if (primary) {
			if (this.plugin.settings.colorPicker1 != 'list') return;
			this.openColorMenu(evt);
			evt.preventDefault();
		} else {
			navigator?.vibrate(100); // Not supported on iOS
			if (this.plugin.settings.colorPicker2 === 'rgb') {
				this.colorPicker.colorPickerEl.showPicker();
			} else if (this.plugin.settings.colorPicker2 === 'list') {
				this.openColorMenu(evt);
				evt.preventDefault();
			}
		}
	}

	/**
	 * Nudge the focused element.
	 */
	private nudgeFocus(event: KeyboardEvent): void {
		if (!(event.target instanceof HTMLElement)) return;

		let focusEl: Element | null = null,
			resultsSettingEl = this.resultsSetting.settingEl,
			resultsControlEl = this.resultsSetting.controlEl;

		switch (event.key) {
			case 'ArrowUp': this.previousColor(); return;
			case 'ArrowDown': this.nextColor(); return;
			case 'ArrowLeft': {
				// Search results
				if (resultsControlEl.contains(event.target)) {
					if (event.target.previousElementSibling) {
						focusEl = event.target.previousElementSibling;
					} else if (!event.repeat) {
						focusEl = resultsControlEl.lastElementChild;
					}
				} else if (event.target === resultsSettingEl) {
					focusEl = resultsControlEl.lastElementChild;
				}
				break;
			}
			case 'ArrowRight': {
				// Search results
				if (resultsControlEl.contains(event.target)) {
					if (event.target.nextElementSibling) {
						focusEl = event.target.nextElementSibling;
					} else if (!event.repeat) {
						focusEl = resultsControlEl.firstElementChild;
					}
				} else if (event.target === resultsSettingEl) {
					focusEl = resultsControlEl.firstElementChild;
				}
			}
		}

		if (focusEl instanceof HTMLElement) {
			event.preventDefault();
			focusEl.focus();
		}
	}

	/**
	 * Confirm the focused element.
	 */
	private confirmFocus(event: KeyboardEvent): void {
		if (!(event.target instanceof HTMLElement)) return;
		let { colorPickerEl } = this.colorPicker;

		// Extra setting buttons
		if (event.target.hasClass('extra-setting-button')) {
			event.preventDefault();
			event.target.click();
		}

		// Color picker
		else if (event.target === colorPickerEl) {
			event.preventDefault();
			let rect = colorPickerEl.getBoundingClientRect(),
				x = rect.x + rect.width / 4,
				y = rect.y + rect.height / 4;
			this.openColorMenu({ x, y });
		}

		// Search field
		else if (event.target === this.searchField.inputEl) {
			if (event.key === 'Enter' && this.search.results.length > 0) {
				event.preventDefault();
				this.closeAndSave(this.search.results[0].id, this.state.color);
			}
		}
	}

	/**
	 * Delete the focused element.
	 */
	private deleteFocus(event: KeyboardEvent): void {
		if (!(event.target instanceof HTMLElement)) return;

		// Anywhere except the search field
		if (event.target !== this.searchField.inputEl) {
			if (event.target === this.colorResetBtn.extraSettingsEl)
				this.colorPicker.colorPickerEl.focus();
			this.resetColor();
		}
	}

	/**
	 * Switch between icon mode or emoji mode.
	 */
	private switchMode(): void {
		if (this.state.mode === 'emoji') this.state.mode = 'icon';
		else this.state.mode = 'emoji';

		// Save the last mode.
		this.plugin.settings.dialogState.pickerMode = this.state.mode;
		this.plugin.requestSave();

		this.search.switchMode(this.state.mode);
		this.requestSearch();
	}

	/**
	 * Run the {@link search} and update the results view.
	 */
	private startSearch(): void {
		this.search.commit(this.searchField.getValue());
		this.updateResults();
	}

	/**
	 * Update results view based on {@link search | `search`}'s results.
	 */
	private updateResults(): void {
		// Preserve UI state
		let { controlEl, settingEl } = this.resultsSetting,
			focusedEl = this.win.document.activeElement,
		 	focusedIndex = focusedEl ? controlEl.indexOf(focusedEl) : -1,
			scrollLeft = settingEl.scrollLeft;

		this.resultsSetting.clear();
		
		// Populate icon buttons
		this.results.toReversed().forEach(({ id, name }) => {
			this.resultsSetting.addExtraButton(btn => btn
				.setTooltip(name)
				.onClick(() => this.closeAndSave(id, this.state.color))
				.then(({ extraSettingsEl: btnEl }) => {
					btnEl.addClass('iconic-search-result', 'iconic-icon');
					btnEl.tabIndex = -1;
					setIconWithColor(btnEl, id, this.state.color);
					if (Platform.isMobile) btnEl.addEventListener('contextmenu', () => {
						navigator?.vibrate(100); // Not supported on iOS
						displayTooltip(btnEl, name);
					});
				})
			)
		});

		// Restore UI state
		if (focusedIndex > -1) {
			let iconEl = controlEl.children[focusedIndex];
			if (iconEl.instanceOf(HTMLElement)) iconEl.focus();
		}

		settingEl.scrollLeft = scrollLeft;

		// Use an invisible button to preserve height
		if (this.results.length) return;
		this.resultsSetting.addExtraButton(btn => btn
			.extraSettingsEl.addClass('iconic-invisible', 'iconic-search-result')
		);
	}

	/**
	 * Open color menu at the given coordinates.
	 */
	private openColorMenu(pos: MenuPositionDef): void {
		let colorMenu = new Menu();

		COLOR_KEYS.forEach(color => colorMenu.addItem(item => item
			.setTitle(Locales.t(`iconPicker.colors.${color}`) ?? color ?? 'color')
			.setChecked(color === this.state.color)
			.setSection('color')
			.setIcon('lucide-paint-bucket')
			.onClick(() => this.changeColor(this.state.color === color
				? undefined
				: color
			))
			.iconEl.setCssProps({ 'color': toRgb(color) })
		));

		colorMenu.showAtPosition(pos);
	}

	/**
	 * Select previous color in list. Used by keyboard and scrollwheel events.
	 */
	private previousColor(): void {
		let index = COLOR_KEYS.indexOf(this.state.color ?? '');

		if (index < 0) index = 0;
		else if (index === 0) index = COLOR_KEYS.length - 1;
		else index--;

		this.changeColor(COLOR_KEYS[index]);
	}

	/**
	 * Select next color in list. Used by keyboard and scrollwheel events.
	 */
	private nextColor(): void {
		let index = COLOR_KEYS.indexOf(this.state.color ?? '');

		if (index < 0) index = 0;
		else if (index >= COLOR_KEYS.length) index = 0;
		else index++;

		this.changeColor(COLOR_KEYS[index]);
	}

	/**
	 * Change the current color state and update the picker's color if needed.
	 * 
	 * @param color If empty or `undefined`, it will reset the color.
	 * @param forceUpdate Force update the picker's color regardless what the
	 * its previous color is.
	 */
	private changeColor(color?: string, forceUpdate = false): void {
		if (!forceUpdate && this.state.color === color) return;
		this.state.color = color;

		let prevHexColor = this.colorPicker.getValue(),
			currHexColor = toRgbHex(color),
			{ colorPickerEl } = this.colorPicker;

		if (forceUpdate || prevHexColor !== currHexColor)
			colorPickerEl.value = currHexColor;

		if (!color) {
			setTooltip(colorPickerEl, Locales.t('iconPicker.changeColor'));
			this.colorResetBtn.extraSettingsEl.hide();
			this.colorResetBtn.extraSettingsEl.tabIndex = -1;
		} else {
			setTooltip(colorPickerEl, Locales.t([`iconPicker.colors.${color}`, color]));
			this.colorResetBtn.extraSettingsEl.show();
			this.colorResetBtn.extraSettingsEl.tabIndex = 0;
		}

		if (this.isOpen) this.updateResults();
	}

	/**
	 * Reset icon to the default color.
	 */
	private resetColor(): void {
		this.changeColor();
	}

	/**
	 * Close dialog while passing icon & color to original callback.
	 */
	private closeAndSave(icon?: string, color?: string): void {
		this.state.items.forEach(({ id, category }) => {
			let manager = this.plugin.getManager(category);
			if (manager instanceof RuleManager) {
				let page = manager.checkPage(id);
				if (page && icon) manager.editRule(page, id, { icon, color }, this.deferRuleIcon);
				else if (page) manager.toggleRule(page, id, false, this.deferRuleIcon);
			} else {
				let registered = !!manager.iconMap[id];
				if (!icon) manager.deleteIcon(id);
				else if (registered) manager.changeIcon(id, icon, color)
				else manager.addIcon(id, icon, color);
			}
		});
		
		this.close();
	}
}