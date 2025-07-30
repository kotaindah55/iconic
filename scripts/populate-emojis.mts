import { writeFile } from 'fs/promises';
import commonData from 'emojibase-data/en/data.json';
import shortcodeData from 'emojibase-data/en/shortcodes/emojibase.json';

const SC_PATH = 'data/emoji-shortcodes.json';
const SN_PATH = 'data/emoji-shortnames.json';

let shortcodePairs: [shortcode: string, emoji: string][] = [],
	shortcodeMap: Record<string, string> = {},
	shortnameMap: Record<string, string> = {};

for (let i = 0; i < commonData.length; i++) {
	let emojiProps = commonData[i],
		shortcodes = shortcodeData[emojiProps.hexcode];

	let capitalizedLabel = emojiProps.label[0].toUpperCase() + emojiProps.label.slice(1);
	shortnameMap[emojiProps.emoji] = capitalizedLabel;

	if (shortcodes instanceof Array) {
		shortcodePairs.push(...shortcodes.map(sc => [sc, emojiProps.emoji] as [string, string]));
	} else {
		shortcodePairs.push([shortcodes, emojiProps.emoji]);
	}
}

shortcodePairs.sort();
shortcodePairs.forEach(([sc, emoji]) => shortcodeMap[sc] = emoji);

await writeFile(SN_PATH, JSON.stringify(shortnameMap, null, '\t'), 'utf-8');
await writeFile(SC_PATH, JSON.stringify(shortcodeMap, null, '\t'), 'utf-8');