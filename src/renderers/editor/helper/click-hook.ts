import { PluginValue, ViewPlugin } from '@codemirror/view';

interface ClickCoordsStore extends PluginValue {
	x: number;
	y: number;
}

const clickCoordsHook = ViewPlugin.define<ClickCoordsStore>(
	() => ({ x: 0, y: 0 }), { eventObservers: {
		mousedown(evt: MouseEvent) {
			this.x = evt.x;
			this.y = evt.y;
		}
	}}
);

export default clickCoordsHook;