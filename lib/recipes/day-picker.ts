export type MonthCell = { day: number; date: string } | null;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

/** "2026-10-05" for a year, a month (1-12) and a day. */
export function isoDate(year: number, month: number, day: number): string {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function isRealDate(value: string): boolean {
	const match = ISO_DATE.exec(value);
	if (!match) return false;
	const [year, month, day] = match.slice(1).map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

/** "2026-10-05,2026-10-12" as sorted, unique, real dates. */
export function datesFrom(value: string): string[] {
	const dates = value
		.split(",")
		.map((part) => part.trim())
		.filter(isRealDate);
	return [...new Set(dates)].sort();
}

/** `value` with `date` switched on or off, as the saved comma list. */
export function toggleDate(value: string, date: string): string {
	const current = datesFrom(value);
	return (
		current.includes(date)
			? current.filter((other) => other !== date)
			: [...current, date].sort()
	).join(",");
}

/** A month laid out in rows of seven, Monday first, with blanks before the 1st. */
export function monthCells(year: number, month: number): MonthCell[] {
	const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	const blanks = (firstWeekday + 6) % 7;
	return [
		...Array.from({ length: blanks }, () => null),
		...Array.from({ length: total }, (_, index) => ({
			day: index + 1,
			date: isoDate(year, month, index + 1),
		})),
	];
}
