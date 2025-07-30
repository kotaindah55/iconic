import { FileType } from './file-types';

export const OPENABLE_FILE_TYPES = new Set<string>([
	FileType.AUDIO,
	FileType.BASE,
	FileType.CANVAS,
	FileType.IMAGE,
	FileType.MARKDOWN,
	FileType.PDF,
	FileType.VIDEO
]);