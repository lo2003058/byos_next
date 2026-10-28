import type { RefreshSchedule } from "@/lib/types";

export const DEFAULT_DEVICE_SCREEN = "simple-text";

export const DEVICE_SETUP_REFRESH_SECONDS = 60;
export const DISPLAY_FALLBACK_REFRESH_SECONDS = 180;
export const DEVICE_SLEEP_REFRESH_SECONDS = 3600;
export const UI_REFRESH_FALLBACK_SECONDS = 300;

export const DEFAULT_DEVICE_TIMEZONE = "UTC";
export const DEFAULT_DEVICE_SLEEP_START = "00:00";
export const DEFAULT_DEVICE_SLEEP_END = "07:00";

export function createDefaultRefreshSchedule(): RefreshSchedule {
	return {
		default_refresh_rate: DEVICE_SETUP_REFRESH_SECONDS,
		time_ranges: [
			{
				start_time: DEFAULT_DEVICE_SLEEP_START,
				end_time: DEFAULT_DEVICE_SLEEP_END,
				refresh_rate: DEVICE_SLEEP_REFRESH_SECONDS,
			},
		],
	};
}

export function serializeRefreshSchedule(schedule: RefreshSchedule): string {
	return JSON.stringify(schedule);
}

/**
 * Whole seconds from a number or numeric string, or null if it is blank,
 * not a number, or not above zero. The device form hands back strings.
 */
export function parseRefreshSeconds(value: unknown): number | null {
	const number =
		typeof value === "number"
			? value
			: typeof value === "string" && value.trim() !== ""
				? Number(value)
				: Number.NaN;
	const seconds = Math.round(number);
	return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function normalizeRefreshSchedule(
	value: unknown,
): RefreshSchedule | null {
	if (!value) return null;
	if (typeof value === "string") {
		try {
			return normalizeRefreshSchedule(JSON.parse(value));
		} catch {
			return null;
		}
	}
	if (typeof value !== "object" || Array.isArray(value)) return null;
	const candidate = value as Partial<Record<keyof RefreshSchedule, unknown>>;
	const defaultRate = parseRefreshSeconds(candidate.default_refresh_rate);
	if (defaultRate === null) return null;
	const timeRanges = Array.isArray(candidate.time_ranges)
		? candidate.time_ranges.flatMap((range): RefreshSchedule["time_ranges"] => {
				if (typeof range !== "object" || range === null) return [];
				const { start_time, end_time, refresh_rate } = range as Record<
					string,
					unknown
				>;
				const rate = parseRefreshSeconds(refresh_rate);
				return typeof start_time === "string" &&
					typeof end_time === "string" &&
					rate !== null
					? [{ start_time, end_time, refresh_rate: rate }]
					: [];
			})
		: [];
	return {
		default_refresh_rate: defaultRate,
		time_ranges: timeRanges,
	};
}
