import Locales from '../locales';

export const FOLDER_SOURCES: Record<string, string> = (() => {
	let sources = ['name', 'parent', 'path'],
		options: Record<string, string> = {};
	sources.forEach(source => options[source] = Locales.t(`ruleEditor.source.${source}`));
	return options;
})();

export const FILE_SOURCES: Record<string, string> = (() => {
	let sources = ['basename', 'extension', 'ctime', 'mtime', 'headings', 'links', 'tags', 'properties'],
		options: Record<string, string> = { ...FOLDER_SOURCES };
	sources.forEach(source => options[source] = Locales.t(`ruleEditor.source.${source}`));
	return options;
})();

export const TEXT_OPERATORS: Record<string, string> = (() => {
	let opertators = ['is', 'contains', 'startsWith', 'endsWith', 'matches'],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const NUMBER_OPERATORS: Record<string, string> = (() => {
	let opertators = ['equals', 'isLessThan', 'isGreaterThan', 'isDivisibleBy'],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const BOOL_OPERATORS: Record<string, string> = (() => {
	let opertators = ['isTrue', 'isFalse'],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const LIST_OPERATORS: Record<string, string> = (() => {
	let opertators = [
			'firstIs',
			'anyIs', 'anyContains', 'anyStartsWith', 'anyEndsWith', 'anyMatches',
			'allAre', 'allContain', 'allStartWith', 'allEndWith', 'allMatch',
			'countEquals', 'countIsLessThan', 'countIsGreaterThan'
		],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const DATETIME_OPERATORS: Record<string, string> = (() => {
	let opertators = [
			'dateTimeIs', '!dateTimeIs', 'dateTimeAfter', 'dateTimeBefore',
			'dateIs', '!dateIs', 'dateAfter', 'dateBefore',
			'timeIs', '!timeIs', 'timeAfter', 'timeBefore',
			'weekdayIs', '!weekdayIs', 'weekdayAfter', 'weekdayBefore',
			'monthdayIs', '!monthdayIs', 'monthdayAfter', 'monthdayBefore',
			'monthIs', '!monthIs', 'monthAfter', 'monthBefore',
			'yearIs', '!yearIs', 'yearAfter', 'yearBefore'
		],
		options: Record<string, string> = {};
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const DATE_OPERATORS: Record<string, string> = (() => {
	let options = { ...DATETIME_OPERATORS };
	for (let opt in options) {
		if (!/time/i.test(opt)) continue;
		delete options[opt];
	}
	return options;
})();

export const PROP_OPERATORS: Record<string, string> = (() => {
	let opertators = ['exists'],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const VALUE_OPERATORS: Record<string, string> = (() => {
	let opertators = ['isEmpty'],
		options: Record<string, string> = {};
	opertators.push(...[...opertators].map(source => '!' + source));
	opertators.forEach(op => options[op] = Locales.t(`ruleEditor.operator.${op}`));
	return options;
})();

export const SOURCE_OPERATOR_MAP: Record<string, Record<string, string>> = {
	get name() { return TEXT_OPERATORS },
	get path() { return TEXT_OPERATORS },
	get parent() { return TEXT_OPERATORS },
	get basename() { return TEXT_OPERATORS },
	get extension() { return TEXT_OPERATORS },
	get ctime() { return DATETIME_OPERATORS },
	get mtime() { return DATETIME_OPERATORS },
	get headings() { return LIST_OPERATORS },
	get tags() { return LIST_OPERATORS },
	get links() { return LIST_OPERATORS },
}

export const WEEKDAYS: Record<string, string> = {
	'0': Locales.t('ruleEditor.weekday.0'),
	'1': Locales.t('ruleEditor.weekday.1'),
	'2': Locales.t('ruleEditor.weekday.2'),
	'3': Locales.t('ruleEditor.weekday.3'),
	'4': Locales.t('ruleEditor.weekday.4'),
	'5': Locales.t('ruleEditor.weekday.5'),
	'6': Locales.t('ruleEditor.weekday.6'),
}

export const MONTHS: Record<string, string> = {
	'0': Locales.t('ruleEditor.month.0'),
	'1': Locales.t('ruleEditor.month.1'),
	'2': Locales.t('ruleEditor.month.2'),
	'3': Locales.t('ruleEditor.month.3'),
	'4': Locales.t('ruleEditor.month.4'),
	'5': Locales.t('ruleEditor.month.5'),
	'6': Locales.t('ruleEditor.month.6'),
	'7': Locales.t('ruleEditor.month.7'),
	'8': Locales.t('ruleEditor.month.8'),
	'9': Locales.t('ruleEditor.month.9'),
	'10': Locales.t('ruleEditor.month.10'),
	'11': Locales.t('ruleEditor.month.11'),
}