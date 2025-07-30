import { DeferredLeaf, FileView, TFile, TypedWorkspaceLeaf, Workspace } from 'obsidian';
import { OPENABLE_FILE_TYPES } from '../constants/view-types';

/**
 * Get all leaves that have {@link OPENABLE_FILE_TYPES | openable file view}
 * and match the given file.
 * 
 * @returns May return {@link DeferredLeaf}.
 */
export function getLeavesOfOpenableFile(
	workspace: Workspace, file: TFile
): (TypedWorkspaceLeaf<FileView> | DeferredLeaf)[] {
	let leaves: (TypedWorkspaceLeaf<FileView> | DeferredLeaf)[] = [];

	workspace.iterateAllLeaves(leaf => {
		let viewType = leaf.view.getViewType(),
			viewState = leaf.getViewState();

		// Only accept openable file type.
		if (!OPENABLE_FILE_TYPES.has(viewType)) return;

		if (leaf.view instanceof FileView && leaf.view.file === file) {
			leaves.push(leaf as TypedWorkspaceLeaf<FileView>);
		} else if (viewState.state?.file === file.path) {
			leaves.push(leaf as DeferredLeaf);
		}
	});

	return leaves;
}