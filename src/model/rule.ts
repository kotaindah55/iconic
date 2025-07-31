import { TAbstractFile } from "obsidian";

type TimeUnit =
	| 'dateTime'
	| 'time'
	| 'date'
	| 'weekday'
	| 'monthday'
	| 'month'
	| 'year';

type TimeOperator = `${TimeUnit}${'Is' | 'After' | 'Before'}`;

export type PositiveOperator =
	| 'is'
	| 'contains'
	| 'startsWith'
	| 'endsWith'
	| 'matches'
	| 'equals'
	| 'isGreaterThan'
	| 'isLessThan'
	| 'isDivisibleBy'
	| 'firstIs'
	| 'allAre'
	| 'allContain'
	| 'allStartWith'
	| 'allEndWith'
	| 'allMatch'
	| 'anyIs'
	| 'anyContains'
	| 'anyStartsWith'
	| 'anyEndsWith'
	| 'anyMatches'
	| 'countEquals'
	| 'countIsGreaterThan'
	| 'countIsLessThan'
	| 'countIsDivisibleBy'
	| 'isEmpty'
	| 'isTrue'
	| 'isFalse'
	| 'exists'
	| TimeOperator;

export type NegativeOperator = `!${PositiveOperator}`;

export type RulePage = 'file' | 'folder';

/**
 * Returns `true` if specified file met the rule/condition criteria.
 */
export interface Judger {
	(file: TAbstractFile): boolean;
	/**
	 * Whether the judger should be (re)run on metadata-changed event.
	 */
	reactive?: boolean;
}

export interface RuleCondition {
	operator: PositiveOperator | NegativeOperator;
	source: string;
	value: string;
}

export interface RuleSpec {
	color?: string;
	conditions: RuleCondition[];
	icon: string;
	match: 'all' | 'any' | 'none';
	name: string;
}

export interface RuleItem extends RuleSpec {
	enabled: boolean;
	id: string;
	judger?: Judger;
	page: RulePage;
}