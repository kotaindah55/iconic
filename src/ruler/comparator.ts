export function is(input: string, condition: string = ''): boolean {
	return input === condition;
}

export function contains(input: string, condition: string = ''): boolean {
	return input.contains(condition);
}

export function startsWith(input: string, condition: string = ''): boolean {
	return input.startsWith(condition);
}

export function endsWith(input: string, condition: string = ''): boolean {
	return input.endsWith(condition);
}

export function matches(input: string, condition: RegExp = new RegExp('')): boolean {
	return condition.test(input);
}

export function equals(input: number, condition: number = 0): boolean {
	return input === condition;
}

export function isGreaterThan(input: number, condition: number = 0): boolean {
	return input > condition;
}

export function isLessThan(input: number, condition: number = 0): boolean {
	return input < condition;
}

export function isDivisibleBy(input: number, condition: number = 0): boolean {
	return input % condition === 0;
}

export function firstIs(input: string[], condition: string = ''): boolean {
	return input[0] === condition;
}

export function allAre(input: string[], condition: string = ''): boolean {
	return input.every(val => val === condition);
}

export function allContain(input: string[], condition: string = ''): boolean {
	return input.every(val => val.contains(condition));
}

export function allStartWith(input: string[], condition: string = ''): boolean {
	return input.every(val => val.startsWith(condition));
}

export function allEndWith(input: string[], condition: string = ''): boolean {
	return input.every(val => val.endsWith(condition));
}

export function allMatch(input: string[], condition: RegExp = new RegExp('')): boolean {
	return input.every(val => condition.test(val));
}

export function anyIs(input: string[], condition: string = ''): boolean {
	return input.some(val => val === condition);
}

export function anyContains(input: string[], condition: string = ''): boolean {
	return input.some(val => val.contains(condition));
}

export function anyStartsWith(input: string[], condition: string = ''): boolean {
	return input.some(val => val.startsWith(condition));
}

export function anyEndsWith(input: string[], condition: string = ''): boolean {
	return input.some(val => val.endsWith(condition));
}

export function anyMatches(input: string[], condition: RegExp = new RegExp('')): boolean {
	return input.some(val => condition.test(val));
}

export function countEquals(input: string[], condition: number = 0): boolean {
	return input.length === condition;
}

export function countIsGreaterThan(input: string[], condition: number = 0): boolean {
	return input.length > condition;
}

export function countIsLessThan(input: string[], condition: number = 0): boolean {
	return input.length < condition;
}

export function countIsDivisibleBy(input: string[], condition: number = 0): boolean {
	return input.length % condition === 0;
}