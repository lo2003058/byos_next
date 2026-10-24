export type YearProgress = {
	year: number;
	dayOfYear: number;
	daysInYear: number;
	daysLeft: number;
	/** Share of the year elapsed including today, one decimal. */
	percent: number;
	/** Weekday of 1 January, Monday = 0. */
	jan1Weekday: number;
};

const DAY_MS = 86_400_000;

function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function datePartsIn(epochMs: number, timezone: string) {
	const format = (tz: string) =>
		new Intl.DateTimeFormat("en-CA", {
			timeZone: tz,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(new Date(epochMs));
	let parts: Intl.DateTimeFormatPart[];
	try {
		parts = format(timezone);
	} catch {
		parts = format("UTC");
	}
	const get = (type: string) =>
		Number(parts.find((part) => part.type === type)?.value);
	return { year: get("year"), month: get("month"), day: get("day") };
}

/** Where `epochMs` falls in its year, using the calendar date in `timezone`. */
export function yearProgress(epochMs: number, timezone: string): YearProgress {
	const { year, month, day } = datePartsIn(epochMs, timezone);
	const daysInYear = isLeapYear(year) ? 366 : 365;
	const dayOfYear =
		Math.round(
			(Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / DAY_MS,
		) + 1;
	return {
		year,
		dayOfYear,
		daysInYear,
		daysLeft: daysInYear - dayOfYear,
		percent: Math.round((dayOfYear / daysInYear) * 1000) / 10,
		jan1Weekday: (new Date(Date.UTC(year, 0, 1)).getUTCDay() + 6) % 7,
	};
}

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export type MonthRow = {
	label: string;
	days: number;
	/** Days of this month before today. */
	doneDays: number;
	/** Day of the month that is today, or null for other months. */
	todayDay: number | null;
};

/** One row per month, with how much of it has passed. */
export function yearMonthGrid(progress: YearProgress): MonthRow[] {
	const today = new Date(Date.UTC(progress.year, 0, progress.dayOfYear));
	const todayMonth = today.getUTCMonth();
	const todayDay = today.getUTCDate();

	return MONTH_LABELS.map((label, month) => {
		const days = new Date(Date.UTC(progress.year, month + 1, 0)).getUTCDate();
		if (month < todayMonth)
			return { label, days, doneDays: days, todayDay: null };
		if (month > todayMonth) return { label, days, doneDays: 0, todayDay: null };
		return { label, days, doneDays: todayDay - 1, todayDay };
	});
}
