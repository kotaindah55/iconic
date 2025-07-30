export function dateTimeIs(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setSeconds(0, 0);
	condDate.setSeconds(0, 0);

	return inputDate.getTime() == condDate.getTime();
}

export function dateTimeAfter(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setSeconds(0, 0);
	condDate.setSeconds(0, 0);

	return inputDate.getTime() > condDate.getTime();
}

export function dateTimeBefore(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setSeconds(0, 0);
	condDate.setSeconds(0, 0);

	return inputDate.getTime() < condDate.getTime();
}

export function timeIs(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return (
		inputDate.getHours() == condDate.getHours() &&
		inputDate.getMinutes() == condDate.getMinutes()
	);
}

export function timeAfter(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return (
		inputDate.getHours() > condDate.getHours() ||
		inputDate.getHours() == condDate.getHours() &&
		inputDate.getMinutes() > condDate.getMinutes()
	);
}

export function timeBefore(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return (
		inputDate.getHours() < condDate.getHours() ||
		inputDate.getHours() == condDate.getHours() &&
		inputDate.getMinutes() < condDate.getMinutes()
	);
}

export function dateIs(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setHours(0, 0, 0, 0);
	condDate.setHours(0, 0, 0, 0);

	return inputDate.getTime() == condDate.getTime();
}

export function dateAfter(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setHours(0, 0, 0, 0);
	condDate.setHours(0, 0, 0, 0);

	return inputDate.getTime() > condDate.getTime();
}

export function dateBefore(input: string | number, condition: string | number = Date.now()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	inputDate.setHours(0, 0, 0, 0);
	condDate.setHours(0, 0, 0, 0);

	return inputDate.getTime() < condDate.getTime();
}

export function weekdayIs(input: string | number, condition: number = new Date().getDay()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDay() == condDate.getDay();
}

export function weekdayAfter(input: string | number, condition: number = new Date().getDay()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDay() > condDate.getDay();
}

export function weekdayBefore(input: string | number, condition: number = new Date().getDay()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDay() < condDate.getDay();
}

export function monthdayIs(input: string | number, condition: number = new Date().getDate()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDate() == condDate.getDate();
}

export function monthdayAfter(input: string | number, condition: number = new Date().getDate()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDate() > condDate.getDate();
}

export function monthdayBefore(input: string | number, condition: number = new Date().getDate()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getDate() < condDate.getDate();
}

export function monthIs(input: string | number, condition: number = new Date().getMonth()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getMonth() == condDate.getMonth();
}

export function monthAfter(input: string | number, condition: number = new Date().getMonth()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getMonth() > condDate.getMonth();
}

export function monthBefore(input: string | number, condition: number = new Date().getMonth()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getMonth() < condDate.getMonth();
}

export function yearIs(input: string | number, condition: number = new Date().getFullYear()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getFullYear() == condDate.getFullYear();
}

export function yearAfter(input: string | number, condition: number = new Date().getFullYear()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getFullYear() > condDate.getFullYear();
}

export function yearBefore(input: string | number, condition: number = new Date().getFullYear()) {
	let inputDate = new Date(input),
		condDate = new Date(condition);

	return inputDate.getFullYear() < condDate.getFullYear();
}