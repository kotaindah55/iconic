import { TFile } from 'obsidian';

export interface MenuInfo {
	isHirearchy: boolean;
	query?: string;
	tagPage: TFile | undefined;
}

declare module 'obsidian' {
	interface Workspace {
		on(
			name: 'tag-wrangler:contextmenu',
			callback: (menu: Menu, tagName: string, info: MenuInfo) => unknown,
			ctx?: unknown
		): EventRef;
	}
}