import { getLastChangelog } from './utils.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { ManifestConfig } from './version-bump.mjs';

let { changelog, version } = await getLastChangelog(),
	manifest = JSON.parse(readFileSync('manifest.json', 'utf8')) as ManifestConfig;

if (version !== manifest.version)
	throw Error('Manifest version doesn\'t match with the changelog!');

writeFileSync('CHANGELOG.md', changelog);