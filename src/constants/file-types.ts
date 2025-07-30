/**
 * File types supported by Obsidian.
 */
export const enum FileType {
	MARKDOWN = 'markdown',
	CANVAS = 'canvas',
	BASE = 'base',
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
	PDF = 'pdf'
}

/**
 * File types mapped onto supported extensions.
 */
export const FILE_TYPE_MAP: Record<string, FileType> = (() => {
	let fileExts: Record<FileType, string[]> = {
		[FileType.MARKDOWN]: ['md'],
		[FileType.CANVAS]: ['canvas'],
		[FileType.BASE]: ['base'],
		[FileType.IMAGE]: ['bmp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'],
		[FileType.AUDIO]: ['mp3', 'wav', 'm4a', '3gp', 'flac', 'ogg', 'oga', 'opus'],
		[FileType.VIDEO]: ['mp4', 'webm', 'ogv', 'mov', 'mkv'],
		[FileType.PDF]: ['pdf']
	};

	let fileTypeMap: Record<string, FileType> = {};
	for (let type in fileExts)
		fileExts[type as FileType].forEach(ext => fileTypeMap[ext] = type as FileType);

	return fileTypeMap;
})();