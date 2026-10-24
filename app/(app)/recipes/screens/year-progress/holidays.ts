import { z } from "zod";

export const PROVINCE_NAMES = {
	AB: "Alberta",
	BC: "British Columbia",
	MB: "Manitoba",
	NB: "New Brunswick",
	NL: "Newfoundland and Labrador",
	NS: "Nova Scotia",
	NT: "Northwest Territories",
	NU: "Nunavut",
	ON: "Ontario",
	PE: "Prince Edward Island",
	QC: "Quebec",
	SK: "Saskatchewan",
	YT: "Yukon",
} as const;

export type ProvinceCode = keyof typeof PROVINCE_NAMES;

export const DEFAULT_PROVINCE: ProvinceCode = "ON";

/** A province code in any case; anything unknown becomes the default. */
export function normalizeProvince(input: string): ProvinceCode {
	const code = input.trim().toUpperCase();
	return code in PROVINCE_NAMES ? (code as ProvinceCode) : DEFAULT_PROVINCE;
}

const nagerHolidaySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	name: z.string().min(1),
	counties: z.array(z.string()).nullable().default(null),
});

export type NagerHoliday = z.infer<typeof nagerHolidaySchema>;

/** Keeps the well-formed entries of a Nager.Date response; never throws. */
export function parseNagerHolidays(raw: unknown): NagerHoliday[] {
	if (!Array.isArray(raw)) return [];
	const holidays: NagerHoliday[] = [];
	for (const entry of raw) {
		const parsed = nagerHolidaySchema.safeParse(entry);
		if (parsed.success) holidays.push(parsed.data);
	}
	return holidays;
}

const DISPLAY_NAMES: Record<string, string> = {
	// Nager lists Dec 26 as St. Stephen's Day; in Canada it is Boxing Day.
	"St. Stephen's Day": "Boxing Day",
};

export function holidayDisplayName(name: string): string {
	return DISPLAY_NAMES[name] ?? name;
}

export type UpcomingHoliday = {
	date: string;
	name: string;
	weekday: string;
	daysUntil: number;
	/** The holiday falls on a Monday or Friday. */
	longWeekend: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_MS = 86_400_000;

function utcDay(iso: string): number {
	const [year, month, day] = iso.split("-").map(Number);
	return Date.UTC(year, month - 1, day);
}

/** The next `limit` holidays on or after `today` (YYYY-MM-DD) for a province. */
export function selectUpcomingHolidays(
	holidays: NagerHoliday[],
	province: ProvinceCode,
	today: string,
	limit: number,
): UpcomingHoliday[] {
	const county = `CA-${province}`;
	const seen = new Set<string>();
	const upcoming: UpcomingHoliday[] = [];

	for (const holiday of holidays) {
		if (holiday.date < today) continue;
		if (holiday.counties && !holiday.counties.includes(county)) continue;
		const name = holidayDisplayName(holiday.name);
		const key = `${holiday.date}|${name}`;
		if (seen.has(key)) continue;
		seen.add(key);

		const weekdayIndex = new Date(utcDay(holiday.date)).getUTCDay();
		upcoming.push({
			date: holiday.date,
			name,
			weekday: WEEKDAYS[weekdayIndex],
			daysUntil: Math.round((utcDay(holiday.date) - utcDay(today)) / DAY_MS),
			longWeekend: weekdayIndex === 1 || weekdayIndex === 5,
		});
	}

	return upcoming
		.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
		.slice(0, limit);
}

const MONTHS = [
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

export function daysUntilLabel(days: number): string {
	if (days === 0) return "Today";
	if (days === 1) return "Tomorrow";
	return `in ${days} days`;
}

/** "2026-12-25" -> "Dec 25". */
export function shortDate(iso: string): string {
	const [, month, day] = iso.split("-").map(Number);
	return `${MONTHS[month - 1]} ${day}`;
}
