export type PayType = "hourly" | "daily" | "monthly" | "annual";

export type PayConfig = {
	payType: PayType;
	/** Gross pay per `payType` period. */
	amount: number;
	/** Days worked, Sunday = 0. */
	workDays: number[];
	/** Minutes after midnight. */
	startMinutes: number;
	endMinutes: number;
	/** Unpaid minutes inside the working day. */
	breakMinutes: number;
};

export type Earnings = { today: number; week: number; month: number };

const PAY_TYPES: readonly PayType[] = ["hourly", "daily", "monthly", "annual"];
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
const DAY_MS = 86_400_000;

export function parsePayType(value: string): PayType {
	const key = value.trim().toLowerCase();
	return PAY_TYPES.find((type) => type === key) ?? "monthly";
}

function dayIndex(name: string): number {
	return DAY_NAMES.indexOf(name.trim().toLowerCase().slice(0, 3));
}

/** "Mon-Fri", "Mon,Wed,Fri" or "Sat-Tue" into sorted weekday numbers. */
export function parseWorkDays(value: string): number[] {
	const days = new Set<number>();
	for (const part of value.split(",")) {
		const [from, to] = part.split("-").map(dayIndex);
		if (from === undefined || from < 0) continue;
		if (to === undefined) {
			days.add(from);
			continue;
		}
		if (to < 0) continue;
		for (let day = from; ; day = (day + 1) % 7) {
			days.add(day);
			if (day === to) break;
		}
	}
	return days.size === 0 ? DEFAULT_WORK_DAYS : [...days].sort((a, b) => a - b);
}

/** "9:30" into minutes after midnight, or `fallback` if it isn't a time. */
export function parseTime(value: string, fallback: number): number {
	const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(value);
	if (!match) return fallback;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	return hours > 23 || minutes > 59 ? fallback : hours * 60 + minutes;
}

type LocalNow = {
	year: number;
	month: number;
	day: number;
	minutes: number;
};

function localNow(epochMs: number, timezone: string): LocalNow {
	const format = (tz: string) =>
		new Intl.DateTimeFormat("en-CA", {
			timeZone: tz,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(new Date(epochMs));
	let parts: Intl.DateTimeFormatPart[];
	try {
		parts = format(timezone);
	} catch {
		parts = format("UTC");
	}
	const get = (type: string) =>
		Number(parts.find((part) => part.type === type)?.value);
	return {
		year: get("year"),
		month: get("month"),
		day: get("day"),
		minutes: get("hour") * 60 + get("minute"),
	};
}

function workDaysInMonth(
	year: number,
	month: number,
	workDays: number[],
): number {
	const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
	let count = 0;
	for (let day = 1; day <= total; day++) {
		const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
		if (workDays.includes(weekday)) count++;
	}
	return count;
}

function paidHours(config: PayConfig): number {
	return Math.max(
		0,
		(config.endMinutes - config.startMinutes - config.breakMinutes) / 60,
	);
}

/** Gross pay for one full working day in the given month. */
function dayPay(config: PayConfig, year: number, month: number): number {
	switch (config.payType) {
		case "hourly":
			return config.amount * paidHours(config);
		case "daily":
			return config.amount;
		default: {
			const days = workDaysInMonth(year, month, config.workDays);
			const monthly =
				config.payType === "annual" ? config.amount / 12 : config.amount;
			return days === 0 ? 0 : monthly / days;
		}
	}
}

function elapsedShare(config: PayConfig, minutes: number): number {
	const length = config.endMinutes - config.startMinutes;
	if (length <= 0) return 0;
	return Math.min(1, Math.max(0, (minutes - config.startMinutes) / length));
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Gross pay earned today, this week (Monday on) and this month so far, using
 * the calendar date and clock in `timezone`.
 */
export function earnings(
	config: PayConfig,
	epochMs: number,
	timezone: string,
): Earnings {
	const now = localNow(epochMs, timezone);
	const todayUtc = Date.UTC(now.year, now.month - 1, now.day);
	const weekday = new Date(todayUtc).getUTCDay();
	const mondayUtc = todayUtc - ((weekday + 6) % 7) * DAY_MS;
	const monthStartUtc = Date.UTC(now.year, now.month - 1, 1);

	let today = 0;
	let week = 0;
	let month = 0;
	const first = Math.min(mondayUtc, monthStartUtc);
	for (let at = first; at <= todayUtc; at += DAY_MS) {
		const date = new Date(at);
		if (!config.workDays.includes(date.getUTCDay())) continue;
		const share = at === todayUtc ? elapsedShare(config, now.minutes) : 1;
		const pay =
			dayPay(config, date.getUTCFullYear(), date.getUTCMonth() + 1) * share;
		if (at === todayUtc) today = pay;
		if (at >= mondayUtc) week += pay;
		if (at >= monthStartUtc) month += pay;
	}
	return { today: round2(today), week: round2(week), month: round2(month) };
}
