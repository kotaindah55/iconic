import { writeFile } from 'fs/promises';
import { IconNodeData, IconProps } from '../data/lucide-icons-extra.mjs';

import LUCIDE_ICONS_SYSTEM from '../data/lucide-icons-system';
import LUCIDE_ICON_NODES from 'lucide-static/icon-nodes.json';
import LUCIDE_LAB_ICON_NODES from '@lucide/lab/icon-nodes.json';

const EXTRA_ICONS_PATH = 'data/lucide-icons-extra.json';
const LETTER_PAIR_RE = /\b([az01])-([az01])\b/;
const MUST_CAP_RE = /\b(?:[a-z]|c?cw)\b/;
const DASH_RE = /-/g;

let systemIcons: Set<string> = new Set(LUCIDE_ICONS_SYSTEM),
	extraIcons: [icon: string, props: IconNodeData[]][] = [],
	extraIconNodeMap: Record<string, IconProps> = {};

function getLabel(icon: string): string {
	let label = icon
		.replace(LETTER_PAIR_RE, (_, p1, p2) => `${p1}${p2}`.toUpperCase())
		.replace(MUST_CAP_RE, match => match.toUpperCase())
		.replace(DASH_RE, ' ')
		.replace('v neck', 'v-neck');
	label = label[0].toUpperCase() + label.slice(1);
	return label;
}

for (let icon in LUCIDE_ICON_NODES) {
	if (systemIcons.has(icon)) continue;
	extraIcons.push([icon, LUCIDE_ICON_NODES[icon] as IconNodeData[]]);
}

for (let icon in LUCIDE_LAB_ICON_NODES) {
	if (systemIcons.has(icon)) continue;
	if (icon in LUCIDE_ICON_NODES) continue;
	extraIcons.push([icon, LUCIDE_LAB_ICON_NODES[icon] as IconNodeData[]]);
}

extraIcons.sort();
extraIcons.forEach(([icon, nodes]) => {
	extraIconNodeMap['lucide-' + icon] = { label: getLabel(icon), nodes };
});

console.log(extraIcons.length);
await writeFile(EXTRA_ICONS_PATH, JSON.stringify(extraIconNodeMap, null, '\t'), 'utf-8');