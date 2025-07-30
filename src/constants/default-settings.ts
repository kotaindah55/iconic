import IconicSettings from '../model/settings';

const DEFAULT_SETTINGS: IconicSettings = {
	biggerIcons: 'mobile',
	clickableIcons: 'desktop',
	showAllFileIcons: true,
	showAllFolderIcons: true,
	minimalFolderIcons: false,
	showMenuActions: true,
	showIconsAtSuggest: true,
	shortCodeSuggest: 'desktop',
	useProperty: true,
	iconProperty: 'icon',
	colorProperty: 'icon color',
	showItemName: 'desktop',
	maxSearchResults: 50,
	colorPicker1: 'list',
	colorPicker2: 'rgb',
	uncolorHover: false,
	uncolorDrag: false,
	uncolorSelect: false,
	uncolorQuick: false,
	rememberDeletedItems: false,
	get dialogState() { return {
		pickerMode: 'icon' as const,
		rulePage: 'file' as const,
	}},
	get leafIcons() { return {} },
	get fileIcons() { return {} },
	get bookmarkIcons() { return {} },
	get tagIcons() { return {} },
	get propertyIcons() { return {} },
	get ribbonIcons() { return {} },
	get fileRules() { return [] },
	get folderRules() { return [] },
}

export default DEFAULT_SETTINGS;