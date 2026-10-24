import { isoDateIn } from "@/lib/time/iso-date";
import {
	type NagerHoliday,
	normalizeProvince,
	PROVINCE_NAMES,
	parseNagerHolidays,
	selectUpcomingHolidays,
	type UpcomingHoliday,
} from "./holidays";

const DEFAULT_TIMEZONE = "America/Toronto";
const FEED = "https://date.nager.at/api/v3/PublicHolidays";
const FETCH_TIMEOUT_MS = 8000;
const REVALIDATE_SECONDS = 86_400;
const MAX_HOLIDAYS = 8;

export type HolidayData = {
	province: string;
	provinceName: string;
	today: string;
	holidays: UpcomingHoliday[];
	error: string;
};

async function fetchYear(year: number): Promise<NagerHoliday[]> {
	const response = await fetch(`${FEED}/${year}/CA`, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		next: { revalidate: REVALIDATE_SECONDS },
	});
	if (!response.ok) {
		throw new Error(`Holiday feed answered ${response.status}`);
	}
	return parseNagerHolidays(await response.json());
}

/**
 * Upcoming public holidays for a province. Never throws: a feed failure is
 * returned as `error` so the screen can say so instead of going blank.
 */
export async function getPublicHolidays(
	params: { province: string },
	context: { deviceTimezone?: string | null } | undefined,
	now: number = Date.now(),
): Promise<HolidayData> {
	const province = normalizeProvince(params.province);
	const today = isoDateIn(now, context?.deviceTimezone ?? DEFAULT_TIMEZONE);
	const year = Number(today.slice(0, 4));

	const results = await Promise.allSettled([
		fetchYear(year),
		fetchYear(year + 1),
	]);
	const loaded = results.flatMap((result) =>
		result.status === "fulfilled" ? result.value : [],
	);
	const failed = results.every((result) => result.status === "rejected");

	return {
		province,
		provinceName: PROVINCE_NAMES[province],
		today,
		holidays: failed
			? []
			: selectUpcomingHolidays(loaded, province, today, MAX_HOLIDAYS),
		error: failed ? "Can't load holiday data" : "",
	};
}
