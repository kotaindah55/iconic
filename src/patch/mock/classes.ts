import {
	BookmarkItem,
	Events,
	PropertyInfo,
	Scope,
	TAbstractFile,
	TFile,
	TFolder
} from 'obsidian';
import { mockTFile, mockTFolder } from './mock-utils';

export class App {
	public dragManager: DragManager;
	public metadataCache: MetadataCache;
	public metadataTypeManager: MetadataTypeManager;
	public scope: Scope;
	public vault: Vault;
	public viewRegistry: ViewRegistry;
	public workspace: Workspace;

	constructor() {
		this.dragManager = new DragManager();
		this.metadataCache = new MetadataCache();
		this.metadataTypeManager = new MetadataTypeManager();
		this.scope = new Scope();
		this.vault = new Vault();
		this.viewRegistry = new ViewRegistry();
		this.workspace = new Workspace(this);
	}

	public loadLocalStorage(..._args: unknown[]): unknown[] {
		return [];
	}
}

export class BookmarksPluginInstance extends Events {
	public hasValidData: boolean;
	public items: BookmarkItem[];

	constructor() {
		super();
		this.hasValidData = true;
		this.items = [
			{ type: 'group', title: 'test-group', ctime: Date.now(), items: [] }
		];
	}

	public getItemTitle(): string {
		return 'Test bookmark';
	}
}

export class DragManager {
	public handleDrop(..._args: unknown[]): void {}
	public handleDrag(..._args: unknown[]): void {}
}

export class MetadataCache extends Events {
	public getTags(): Record<string, number> {
		return { '#test': 1 };
	}
}

export class MetadataTypeManager extends Events {
	private properties: Record<string, PropertyInfo>;

	constructor() {
		super();
		this.properties = { test: { count: 0, name: 'test', type: 'text' }};
	}

	public getAllProperties(): Record<string, PropertyInfo> {
		return this.properties;
	}

	public getTypeInfo(..._args: unknown[]) {
		return {
			expected: { icon: 'lucide-text', type: 'text' },
			inferred: { icon: 'lucide-text', type: 'text' }
		};
	}
}

export class Vault extends Events {
	public fileMap: Record<string, TAbstractFile>;
	public root: TFolder;

	constructor() {
		super();

		let fakeFile = mockTFile('fakeFile', 'fakeFile'),
			fakeFolder = mockTFolder('fakeFolder', 'fakeFolder'),
			children: TAbstractFile[] = [fakeFile, fakeFolder];

		this.root = mockTFolder('/', '', children);
		this.fileMap = { '/': this.root, fakeFile, fakeFolder };
	}

	public getAllLoadedFiles(): TAbstractFile[] {
		return Object.values(this.fileMap);
	}

	public getConfig(..._args: unknown[]): unknown {
		return true;
	}

	public getRoot(): TFolder { return this.root }
}

export class ViewRegistry extends Events {}

export class Workspace extends Events {
	public app: App;

	constructor(app: App) {
		super();
		this.app = app;
	}

	public getActiveFile(): TFile | undefined {
		return this.app.vault.fileMap['fakeFile'] as TFile;
	}

	public onLayoutReady(handler: () => unknown): void {
		handler();
	}

	public requestSaveLayout(): void {}
}

export class WorkspaceLeaf extends Events {
	public app: App;
	public containerEl: HTMLElement;

	constructor() {
		super();
		this.app = new App();
		this.containerEl = createDiv();
	}

	public onLayoutReady(..._args: unknown[]): void {}
}