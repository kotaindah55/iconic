import lucide_icons_extra from 'data/lucide-icons-extra.json';

export type IconNodeType =
	| 'path'
	| 'line'
	| 'polygon'
	| 'polyline'
	| 'circle'
	| 'ellipse'
	| 'rect';

export type IconNodeData = [
	type: IconNodeType,
	attrs: Record<string, string>
];

export interface IconProps {
	label: string;
	nodes: IconNodeData[];
}

/**
 * Extra icons from mainstream Lucide and Lucide Lab that don't exist yet
 * in Obsidian.
 * 
 * All of the icon ids and their node data are licensed under ISC license.
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022
 * as part of Feather (MIT). All other copyright (c) for Lucide are held
 * by Lucide Contributors 2022.
 * 
 * @see https://lucide.dev
 * @see https://github.com/lucide-icons/lucide
 * @see https://github.com/lucide-icons/lucide-lab
 * 
 * @version Lucide-0.525.0
 * @since Lucide-0.447.0
 */
const LUCIDE_ICONS_EXTRA = lucide_icons_extra as unknown as Record<string, IconProps>;

export default LUCIDE_ICONS_EXTRA;