import { ItemDesc } from '../dialogs/icon-picker';

declare global {
	interface Element {
		iconicMetadata?: ItemDesc
	}
}