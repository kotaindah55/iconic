import { RuleItem, RulePage } from 'src/model/rule';
import { IconBase } from 'src/model/icon-item';
import { Except } from 'type-fest';

/**
 * Interface for storing plugin settings and user-selected icons.
 */
export default interface IconicSettings {
	// Icon behavior
	biggerIcons: string;
	clickableIcons: string;
	showAllFileIcons: boolean;
	showAllFolderIcons: boolean;
	minimalFolderIcons: boolean;

	// Menu & dialogs
	showMenuActions: boolean;
	showIconsAtSuggest: boolean;
	
	// Editor
	shortCodeSuggest: string;
	
	// Icon property
	useProperty: boolean;
	iconProperty: string;
	colorProperty: string;
	
	// Icon picker
	showItemName: string;
	maxSearchResults: number;
	colorPicker1: string;
	colorPicker2: string;

	// Advanced
	uncolorHover: boolean;
	uncolorDrag: boolean;
	uncolorSelect: boolean;
	uncolorQuick: boolean;
	rememberDeletedItems: boolean;

	dialogState: {
		pickerMode: 'emoji' | 'icon';
		rulePage: RulePage;
	},
	fileIcons: Record<string, IconBase>;
	leafIcons: Record<string, IconBase>;
	bookmarkIcons: Record<string, IconBase>;
	tagIcons: Record<string, IconBase>;
	propertyIcons: Record<string, IconBase>;
	ribbonIcons: Record<string, IconBase>;
	fileRules: RuleItem[];
	folderRules: RuleItem[];
}

/**
 * List of settings that will be displayed in the setting tab.
 */
export type MainSettings = Except<
	IconicSettings,
	| 'dialogState'
	| 'fileIcons'
	| 'leafIcons'
	| 'bookmarkIcons'
	| 'tagIcons'
	| 'propertyIcons'
	| 'ribbonIcons'
	| 'fileRules'
	| 'folderRules'
>;

export type AppearanceSettings = Pick<
	MainSettings,
	| 'biggerIcons'
	| 'clickableIcons'
	| 'uncolorHover'
	| 'uncolorDrag'
	| 'uncolorSelect'
	| 'uncolorQuick'
>