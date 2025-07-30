import { App, TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { WorkspaceLeaf as FakeWorkspaceLeaf } from './classes';

export function mockTFolder(path: string, name: string, children: TAbstractFile[] = []): TFolder {
	return Object.setPrototypeOf({
		path, name, children
	}, TFolder.prototype);
}

export function mockTFile(path: string, name: string): TFile {
	return Object.setPrototypeOf({
		path, name, basename: name, extension: ''
	}, TFile.prototype);
}

/**
 * Mock {@link WorkspaceLeaf} for hooking/patching purpose.
 * @param app When left blank, it will use fake {@link App | app} rather
 * than the original one.
 */
export function mockLeaf(app?: App): WorkspaceLeaf {
	let fakeLeaf = new FakeWorkspaceLeaf() as unknown as WorkspaceLeaf;
	if (app) Object.assign(fakeLeaf, { app });
	return fakeLeaf;
}