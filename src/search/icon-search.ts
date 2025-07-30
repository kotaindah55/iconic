import { prepareSimpleSearch, SearchResult } from 'obsidian';
import { ICON_MAP } from '../constants/icons';
import EMOJI_SHORTNAMES from '../../data/emoji-shortnames.mjs';
import IconicPlugin from '../main';

type SearchCallback = (entry: string) => SearchResult | null;

export interface IconSearchResult {
	id: string;
	name: string;
	score: number;
}

export default class IconSearch {
	public readonly results: IconSearchResult[];

	private readonly plugin: IconicPlugin;
	private readonly iterCallback: (name: string, id: string) => void;
	
	private query: string;
	private callback: SearchCallback;
	private mode: 'icon' | 'emoji';

	constructor(plugin: IconicPlugin, mode: 'icon' | 'emoji') {
		this.plugin = plugin;
		this.results = [];
		this.query = '';
		this.callback = prepareSimpleSearch('');
		this.mode = mode;

		this.iterCallback = (name, id) => {
			let result = this.callback(name);
			if (!result) return;
			this.results.push({ id, name, score: result.score });
		};
	}

	/**
	 * Commit a search query and produce the callback with it.
	 * 
	 * @param run Immediately run the search after committing. Default to
	 * true.
	 */
	public commit(query: string, run = true): void {
		// Don't search on the same query.
		if (query === this.query) return;

		this.callback = prepareSimpleSearch(query);
		this.query = query;
		if (run) this.run();
	}

	/**
	 * Run and get the search results.
	 */
	public run(): void {
		// Empty the previous results.
		this.results.splice(0);
		if (!this.query) return;

		if (this.mode === 'icon') ICON_MAP.forEach(this.iterCallback);
		else Object.each(EMOJI_SHORTNAMES, this.iterCallback);

		// Sort the results by their score firstly, and by their name secondly.
		this.results.sort((a, b) => {
			let order = a.score - b.score;
			if (order !== 0) return order;
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});

		// Restrict their amount by settings.maxSearchResults.
		this.results.splice(this.getMax());
	}

	/**
	 * Get current search query.
	 */
	public getQuery(): string {
		return this.query;
	}

	/**
	 * Get max amount of the results.
	 */
	public getMax(): number {
		return this.plugin.settings.maxSearchResults;
	}

	/**
	 * Switch between searching for icons or emojis.
	 */
	public switchMode(mode: 'icon' | 'emoji'): void {
		if (this.mode !== mode) {
			this.mode = mode;
			this.query = '';
		}
	}
}