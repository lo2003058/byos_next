export const WEEKDAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

function weekdayAt(name: string): number {
	const key = name.trim().toLowerCase().slice(0, 3);
	return WEEKDAYS.findIndex((day) => day.toLowerCase() === key);
}

/** "Mon-Fri", "Mon,Wed" or "Sat-Mon" as weekdays in week order. */
export function weekdaysFrom(value: string): Weekday[] {
	const picked = new Set<number>();
	for (const part of value.split(",")) {
		const [from, to] = part.split("-").map(weekdayAt);
		if (from === undefined || from < 0) continue;
		if (to === undefined) {
			picked.add(from);
			continue;
		}
		if (to < 0) continue;
		for (let day = from; ; day = (day + 1) % 7) {
			picked.add(day);
			if (day === to) break;
		}
	}
	return [...picked].sort((a, b) => a - b).map((index) => WEEKDAYS[index]);
}

/** Weekdays as the saved "Mon,Tue" form, in week order. */
export function formatWeekdays(days: readonly Weekday[]): string {
	return WEEKDAYS.filter((day) => days.includes(day)).join(",");
}

/** `value` with `day` switched on or off. */
export function toggleWeekday(value: string, day: Weekday): string {
	const current = weekdaysFrom(value);
	return formatWeekdays(
		current.includes(day)
			? current.filter((other) => other !== day)
			: [...current, day],
	);
}
