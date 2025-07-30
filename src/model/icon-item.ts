export type IconItemCategory = 'bookmark' | 'file' | 'folder' | 'property' | 'ribbon' | 'rule' | 'leaf' | 'tag';

/**
 * Base icon specification.
 */
export interface IconBase {
	icon: string;
	color?: string;
}

export interface IconItem {
	category: IconItemCategory;
	color?: string;
	icon?: string;
	iconDefault?: string;
	/**
	 * Unique id for this item in respect of its category:
	 * 
	 * - path for `file` and `folder` categories,
	 * - creation timestamp for `bookmark` category,
	 * - property name for `property` category,
	 * - tag name for `tag` category,
	 * - ribbon id for `ribbon` category,
	 * - view type for `tab` category.
	 */
	id: string;
}