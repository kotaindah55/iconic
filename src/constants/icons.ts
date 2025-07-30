import { BookmarkType, getIconIds } from 'obsidian';
import { FileType } from './file-types';
import LUCIDE_ICONS_EXTRA from '../../data/lucide-icons-extra.mjs';

/**
 * Get tidy name of corresponding icon id.
 */
function getIconTidyName(iconId: string): string {
	let tidyName = iconId.replace(/^lucide-/, '').replaceAll('-', ' '),
		capitalizedName = (tidyName[0].toUpperCase() + tidyName.slice(1));
	
	return capitalizedName;
}

/**
 * Populate icons map and store it into `ICONS`.
 */
function populateIcons() {
	ICON_MAP.clear();

	// Populate Lucide extra icons
	const EXTRA_ICON_NAMES: string[][] = [];
	for (let id in LUCIDE_ICONS_EXTRA)
		EXTRA_ICON_NAMES.push([id, LUCIDE_ICONS_EXTRA[id].label]);

	const FIXED_ICON_NAMES: Record<string, string> = {
		'lucide-app-window-mac': 'App window Mac',
		'lucide-archive-x': 'Archive X',
		'lucide-arrow-down-az': 'Arrow down AZ',
		'lucide-arrow-down-za': 'Arrow down ZA',
		'lucide-arrow-up-az': 'Arrow up AZ',
		'lucide-arrow-up-za': 'Arrow up ZA',
		'lucide-axis-3d': 'Axis 3D',
		'lucide-badge-indian-rupee': 'Badge Indian rupee',
		'lucide-badge-japanese-yen': 'Badge Japanese yen',
		'lucide-badge-russian-ruble': 'Badge Russian ruble',
		'lucide-badge-swiss-franc': 'Badge Swiss franc',
		'lucide-badge-x': 'Badge X',
		'lucide-book-a': 'Book A',
		'lucide-book-x': 'Book X',
		'lucide-calendar-x': 'Calendar X',
		'lucide-calendar-x2': 'Calendar X 2',
		'lucide-cctv': 'CCTV',
		'lucide-chart-gantt': 'Chart Gantt',
		'lucide-chart-no-axes-gantt': 'Chart no axes Gantt',
		'lucide-circle-x': 'Circle X',
		'lucide-clipboard-x': 'Clipboard X',
		'lucide-code-xml': 'Code XML',
		'lucide-copy-x': 'Copy X',
		'lucide-cpu': 'CPU',
		'lucide-creative-commons': 'Creative Commons',
		'lucide-dna': 'DNA',
		'lucide-dna-off': 'DNA off',
		'lucide-file-axis-3d': 'File axis 3D',
		'lucide-file-json': 'File JSON',
		'lucide-file-json-2': 'File JSON 2',
		'lucide-file-x': 'File X',
		'lucide-file-x2': 'File X 2',
		'lucide-filter-x': 'Filter X',
		'lucide-folder-git': 'Folder Git',
		'lucide-folder-git-2': 'Folder Git 2',
		'lucide-folder-x': 'Folder X',
		'lucide-github': 'GitHub',
		'lucide-gitlab': 'GitLab',
		'lucide-grid-2x-2': 'Grid 2x2',
		'lucide-grid-2x-2check': 'Grid 2x2 check',
		'lucide-grid-2x-2plus': 'Grid 2x2 plus',
		'lucide-grid-2x-2x': 'Grid 2x2 X',
		'lucide-grid-3x-3': 'Grid 3x3',
		'lucide-hdmi-port': 'HDMI port',
		'lucide-id-card': 'ID card',
		'lucide-iteration-ccw': 'Iteration CCW',
		'lucide-iteration-cw': 'Iteration CW',
		'lucide-linkedin': 'LinkedIn',
		'lucide-list-x': 'List X',
		'lucide-mail-x': 'Mail X',
		'lucide-map-pin-x': 'Map pin X',
		'lucide-map-pin-xinside': 'Map pin X inside',
		'lucide-message-circle-x': 'Message circle X',
		'lucide-message-square-x': 'Message square X',
		'lucide-monitor-x': 'Monitor X',
		'lucide-move-3d': 'Move 3D',
		'lucide-navigation-2off': 'Navigation 2 off',
		'lucide-nfc': 'NFC',
		'lucide-octagon-x': 'Octagon X',
		'lucide-package-x': 'Package X',
		'lucide-pc-case': 'PC case',
		'lucide-qr-code': 'QR code',
		'lucide-receipt-indian-rupee': 'Receipt Indian rupee',
		'lucide-receipt-japanese-yen': 'Receipt Japanese yen',
		'lucide-receipt-russian-ruble': 'Receipt Russian ruble',
		'lucide-receipt-swiss-franc': 'Receipt Swiss franc',
		'lucide-refresh-ccw': 'Refresh CCW',
		'lucide-refresh-ccw-dot': 'Refresh CCW dot',
		'lucide-refresh-cw': 'Refresh CW',
		'lucide-refresh-cw-off': 'Refresh CW off',
		'lucide-square-chart-gantt': 'Square chart Gantt',
		'lucide-square-gantt-chart': 'Square Gantt chart',
		'lucide-square-m': 'Square M',
		'lucide-square-x': 'Square X',
		'lucide-ticket-x': 'Ticket X',
		'lucide-rotate-3d': 'Rotate 3D',
		'lucide-rotate-ccw': 'Rotate CCW',
		'lucide-rotate-ccw-square': 'Rotate CCW square',
		'lucide-rotate-cw': 'Rotate CW',
		'lucide-rotate-cw-square': 'Rotate CW square',
		'lucide-tv': 'TV',
		'lucide-tv-2': 'TV 2',
		'lucide-tv-minimal': 'TV minimal',
		'lucide-tv-minimal-play': 'TV minimal play',
		'lucide-rss': 'RSS',
		'lucide-scale-3d': 'Scale 3D',
		'lucide-scan-qr-code': 'Scan QR code',
		'lucide-search-x': 'Search X',
		'lucide-shield-x': 'Shield X',
		'lucide-smartphone-nfc': 'Smartphone NFC',
		'lucide-user-x': 'User X',
		'lucide-user-x2': 'User X 2',
		'lucide-user-round-x': 'User round X',
		'lucide-wifi': 'WiFi',
		'lucide-wifi-high': 'WiFi high',
		'lucide-wifi-low': 'WiFi low',
		'lucide-wifi-off': 'WiFi off',
		'lucide-wifi-zero': 'WiFi zero',
		'refresh-cw-off': 'Refresh CW off',
		'uppercase-lowercase-a': 'Uppercase lowercase A'
	};

	getIconIds()
		// Map icon name onto its id
		.map(id => [id, FIXED_ICON_NAMES[id] ?? getIconTidyName(id)])
		// Add extra icons
		.concat(EXTRA_ICON_NAMES)
		// Sort icon names alphabetically
		.sort(([, aName], [, bName]) => aName.localeCompare(bName))
		// Populate ICONS map
		.forEach(([id, name]) => {
			ICON_MAP.set(id, name);
			if (id.startsWith('lucide-')) id = id.slice(7);
			ICONS.push(id);
		});

	ICONS.sort();
}

/**
 * All icon ids including Lucide extra icons, they're just have "lucide"
 * tag omitted, purposely used for shortcode suggestion.
 */
export const ICONS: string[] = [];

/**
 * Holds id-name pair of each icon with its id as the key.
 */
export const ICON_MAP = new Map<string, string>();

export const DEFAULT_FILE_ICONS = new Map<FileType, string>([
	[FileType.MARKDOWN, 'lucide-file-text'],
	[FileType.CANVAS, 'lucide-layout-dashboard'],
	[FileType.BASE, 'lucide-layout-list'],
	[FileType.IMAGE, 'lucide-image'],
	[FileType.AUDIO, 'lucide-file-audio'],
	[FileType.VIDEO, 'lucide-file-video'],
	[FileType.PDF, 'lucide-file-chart-pie']
]);

export const BUILTIN_BOOKMARK_ICONS = new Map<BookmarkType, string>([
	['file', 'lucide-file'],
	['folder', 'lucide-folder'],
	['graph', 'lucide-git-fork'],
	['search', 'lucide-search'],
	['url', 'lucide-globe-2']
]);

populateIcons();