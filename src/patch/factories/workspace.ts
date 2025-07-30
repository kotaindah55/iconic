import { around, ObjectFactory } from 'monkey-around';
import { Platform, Workspace } from 'obsidian';

const MAX_DISPLAY_TEXT_LEN = 60;

const workspaceFactory: ObjectFactory<Workspace> = {
	onDragLeaf: oldFn => function (this: Workspace, evt, leaf) {
		oldFn.call(this, evt, leaf);
		if (Platform.isPhone || Platform.isMobile) return;

		let iconSvg = leaf.tabHeaderInnerIconEl.firstElementChild?.cloneNode(true);
		if (!iconSvg || !(iconSvg instanceof Element)) return;

		let dragGhostEl = createDiv('drag-ghost mod-leaf'),
			displayText = leaf.getDisplayText();
		
		if (displayText.length > MAX_DISPLAY_TEXT_LEN)
			displayText = displayText.slice(0, MAX_DISPLAY_TEXT_LEN - 1).trim() + '…';

		dragGhostEl.createDiv('drag-ghost-icon').append(iconSvg);
		dragGhostEl.createSpan({ text: displayText });
		evt.doc.body.appendChild(dragGhostEl);
		evt.dataTransfer?.setDragImage(dragGhostEl, 0, 0);
		evt.win.setTimeout(() => dragGhostEl.detach());
	}
}

export function patchWorkspace() {
	return around(Workspace.prototype, workspaceFactory);
}