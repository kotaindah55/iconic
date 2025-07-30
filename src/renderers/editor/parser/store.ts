import { ChangeDesc } from '@codemirror/state';
import { Tree } from '@lezer/common';

export default class StateStore {
	public oldTree: Tree;
	private changes: ChangeDesc | null;

	constructor() {
		this.changes = null;
	}

	public hasChanges(): boolean {
		return !!this.changes;
	}

	public storeChanges(changes: ChangeDesc): void {
		if (this.changes) this.changes = this.changes.composeDesc(changes);
		else this.changes = changes;
	}

	public takeChanges(): ChangeDesc | null {
		let changes = this.changes;
		this.changes = null;
		return changes;
	}
}