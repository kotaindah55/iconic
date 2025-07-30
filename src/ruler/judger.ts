import { App, TAbstractFile, TFile, TFolder } from 'obsidian';
import { unwrapRegexp } from '../@external/obsidian-plugin-helper/src/global';
import { Judger, PositiveOperator, RuleCondition, RuleItem } from '../model/rule';
import * as Comparator from './comparator';
import * as TimeComparator from './time-comparator';

/**
 * Unique value to indicate an absent of certain note property.
 */
const propNotExist = Symbol('propNotExist');

/**
 * Create single condition-based judger with {@link TFolder} as an input.
 */
function createFolderJudger(condition: RuleCondition): Judger | undefined {
	let judge: (folder: TFolder) => boolean,
		getValue: (folder: TFolder) => string,
		{ source, operator, value: condValue } = condition,
		isNegated = operator.startsWith('!');
	
	// Determines whether the operator is negative.
	operator = isNegated
		? operator.slice(1) as PositiveOperator
		: operator as PositiveOperator;
	
	// Create value getter based on the condition source.
	switch (source) {
		case 'name': getValue = folder => folder.name; break;
		case 'path': getValue = folder => folder.path; break;
		case 'parent': getValue = folder => folder.parent?.name ?? ''; break;
		default: return;
	}

	// Create folder judger based on the operator.
	switch (operator) {
		case 'is': judge = folder => {
			return Comparator.is(getValue(folder), condValue) !== isNegated
		}; break;

		case 'contains': judge = folder => {
			return Comparator.contains(getValue(folder), condValue) !== isNegated
		}; break;

		case 'startsWith': judge = folder => {
			return Comparator.startsWith(getValue(folder), condValue) !== isNegated;
		}; break;

		case 'endsWith': judge = folder => {
			return Comparator.endsWith(getValue(folder), condValue) !== isNegated
		}; break;

		case 'matches': {
			let regexp = unwrapRegexp(condValue) ?? new RegExp('');
			judge = folder => {
				return Comparator.matches(getValue(folder), regexp) !== isNegated;
			}; break;
		}

		default: return;
	}

	return judge;
}

/**
 * Create single condition-based judger with {@link TFile} as an input.
 */
function createFileJudger(app: App, condition: RuleCondition): Judger | undefined {
	let judge: (file: TFile) => boolean,
		getValue: (file: TFile) => unknown,
		{ source, operator, value: condVal } = condition,
		{ metadataCache } = app,
		useProperty = source.startsWith('property:'),
		isNegated = operator.startsWith('!');
	
	// Determines whether the operator is negative.
	operator = isNegated
		? operator.slice(1) as PositiveOperator
		: operator as PositiveOperator;
	
	// Create value getter for the property-based source.
	if (useProperty) {
		getValue = file => {
			let property = source.slice(9),
				metadata = metadataCache.getFileCache(file),
				frontmatter = metadata?.frontmatter;
			
			if (!frontmatter?.hasOwnProperty(property)) return propNotExist;
			return frontmatter[property];
		}
	}

	// Create value getter for the other source.
	else switch (source) {
		case 'name': getValue = file => file.name; break;
		case 'path': getValue = file => file.path; break;
		case 'parent': getValue = file => file.parent?.name ?? ''; break;
		case 'basename': getValue = file => file.basename; break;
		case 'extension': getValue = file => file.extension; break;
		case 'ctime': getValue = file => file.stat.ctime; break;
		case 'mtime': getValue = file => file.stat.mtime; break;
		case 'headings': getValue = file => {
			let metadata = metadataCache.getFileCache(file);
			return metadata?.headings?.map(headingCache => headingCache.heading) ?? [];
		}; break;
		case 'tags': getValue = file => {
			let metadata = metadataCache.getFileCache(file);
			return metadata?.tags?.map(tagCache => tagCache.tag) ?? [];
		}; break;
		case 'links': getValue = file => {
			let metadata = metadataCache.getFileCache(file);
			return metadata?.links?.map(linkCache => linkCache.link) ?? [];
		}; break;
		default: return;
	}

	// Create folder judger based on the operator.
	switch (operator) {
		case 'is': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'string') return false;
			return Comparator.is(value, condVal) !== isNegated;
		}; break;

		case 'contains': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'string') return false;
			return Comparator.contains(value, condVal) !== isNegated;
		}; break;

		case 'startsWith': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'string') return false;
			return Comparator.startsWith(value, condVal) !== isNegated;
		}; break;

		case 'endsWith': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'string') return false;
			return Comparator.endsWith(value, condVal) !== isNegated;
		}; break;

		case 'matches': {
			let regexp = unwrapRegexp(condVal) ?? new RegExp('');
			judge = file => {
				let value = getValue(file);
				if (typeof value !== 'string') return false;
				return Comparator.matches(value, regexp) !== isNegated;
			}; break;
		}

		case 'equals': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'number') return false;
			return Comparator.equals(value, Number(condVal)) !== isNegated;
		}; break;

		case 'isGreaterThan': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'number') return false;
			return Comparator.isGreaterThan(value, Number(condVal)) !== isNegated;
		}; break;

		case 'isLessThan': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'number') return false;
			return Comparator.isLessThan(value, Number(condVal)) !== isNegated;
		}; break;

		case 'isDivisibleBy': judge = file => {
			let value = getValue(file);
			if (typeof value !== 'number') return false;
			return Comparator.isDivisibleBy(value, Number(condVal)) !== isNegated;
		}; break;

		case 'isTrue': judge = file => (getValue(file) === true) !== isNegated; break;

		case 'isFalse': judge = file => (getValue(file) === false) !== isNegated; break;

		case 'isEmpty': judge = file => {
			let value = getValue(file);
			return (
				value === '' ||
				value === null ||
				value === undefined ||
				value instanceof Array && !value.length
			) !== isNegated;
		}; break;

		case 'exists': judge = file => {
			return (getValue(file) === propNotExist) !== isNegated;
		}; break;

		case 'allAre': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.allAre(value, condVal) !== isNegated;
		}; break;

		case 'allContain': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.allContain(value, condVal) !== isNegated;
		}; break;

		case 'allStartWith': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.allStartWith(value, condVal) !== isNegated;
		}; break;

		case 'allEndWith': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.allEndWith(value, condVal) !== isNegated;
		}; break;

		case 'allMatch': {
			let regexp = unwrapRegexp(condVal) ?? new RegExp('');
			judge = file => {
				let value = getValue(file) as string[];
				if (!(value instanceof Array)) return false;
				return Comparator.allMatch(value, regexp) !== isNegated;
			}; break;
		}

		case 'anyIs': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.anyIs(value, condVal) !== isNegated;
		}; break;

		case 'anyContains': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.anyContains(value, condVal) !== isNegated;
		}; break;

		case 'anyStartsWith': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.anyStartsWith(value, condVal) !== isNegated;
		}; break;

		case 'anyEndsWith': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.anyEndsWith(value, condVal) !== isNegated;
		}; break;

		case 'anyMatches': {
			let regexp = unwrapRegexp(condVal) ?? new RegExp('');
			judge = file => {
				let value = getValue(file) as string[];
				if (!(value instanceof Array)) return false;
				return Comparator.anyMatches(value, regexp) !== isNegated;
			}; break;
		}

		case 'countEquals': judge = file => {
			let value = getValue(file) as string[];
			if (!(value instanceof Array)) return false;
			return Comparator.countEquals(value, Number(condVal));
		}; break;

		case 'dateTimeIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateTimeIs(value, condVal);
		}; break;

		case 'dateTimeAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateTimeAfter(value, condVal);
		}; break;

		case 'dateTimeBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateTimeBefore(value, condVal);
		}; break;

		case 'dateIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateIs(value, condVal);
		}; break;

		case 'dateAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateAfter(value, condVal);
		}; break;

		case 'dateBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.dateBefore(value, condVal);
		}; break;

		case 'timeIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.timeIs(value, condVal);
		}; break;

		case 'timeAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.timeAfter(value, condVal);
		}; break;

		case 'timeBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.timeBefore(value, condVal);
		}; break;

		case 'weekdayIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.weekdayIs(value, Number(condVal));
		}; break;

		case 'weekdayAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.weekdayAfter(value, Number(condVal));
		}; break;

		case 'weekdayBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.weekdayBefore(value, Number(condVal));
		}; break;

		case 'monthdayIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthdayIs(value, Number(condVal));
		}; break;

		case 'monthdayAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthdayAfter(value, Number(condVal));
		}; break;

		case 'monthdayBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthdayBefore(value, Number(condVal));
		}; break;

		case 'monthIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthIs(value, Number(condVal));
		}; break;

		case 'monthAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthAfter(value, Number(condVal));
		}; break;

		case 'monthBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.monthBefore(value, Number(condVal));
		}; break;

		case 'yearIs': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.yearIs(value, Number(condVal));
		}; break;

		case 'yearAfter': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.yearAfter(value, Number(condVal));
		}; break;

		case 'yearBefore': judge = file => {
			let value = getValue(file) as number | string;
			return TimeComparator.yearBefore(value, Number(condVal));
		}; break;

		default: return;
	}

	if (
		useProperty ||
		source === 'mtime' ||
		source === 'headings' ||
		source === 'tags' ||
		source === 'links'
	) Object.assign(judge, { reactive: true });

	return judge;
}

/**
 * Create a rule-based judger from specified {@link rule}.
 */
export default function createJudger(app: App, rule: RuleItem): Judger {
	let parties: Judger[] = [],
		reactive = false;

	// Create a bulk of file judgers if the page is 'file'.
	if (rule.page === 'file') rule.conditions.forEach(cond => {
		let fileJudger = createFileJudger(app, cond);
		if (fileJudger) {
			parties.push(fileJudger);
			reactive = fileJudger.reactive ?? false;
		}
	});

	// Otherwise, create folder judgers instead.
	else rule.conditions.forEach(cond => {
		let folderJudger = createFolderJudger(cond);
		if (folderJudger) parties.push(folderJudger);
	});

	// Merge the party judgers to a single judger.
	let ruleJudger: Judger = (file: TAbstractFile) => {
		if (
			rule.page === 'file' && file instanceof TFolder ||
			rule.page === 'folder' && file instanceof TFile
		) throw TypeError('Input file doesn\'t match with the rule page');

		if (rule.match === 'all') return parties.every(party => party(file));
		if (rule.match === 'any') return parties.some(party => party(file));
		if (rule.match === 'none') return !parties.every(party => party(file));
		return false;
	}

	if (reactive) ruleJudger.reactive = true;
	return ruleJudger;
}