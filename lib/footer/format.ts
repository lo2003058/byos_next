import { estimateBatteryLife } from "@/utils/helpers";
import type {
	FooterBatteryFormat,
	FooterConfig,
	FooterDateFormat,
} from "./config";

const DATE_OPTIONS: Record<
	Exclude<FooterDateFormat, "none" | "iso" | "dmy">,
	Intl.DateTimeFormatOptions
> = {
	short: { month: "short", day: "numeric" },
	"weekday-short": { weekday: "short", month: "short", day: "numeric" },
};

/** Date in the device's timezone; empty for "none" or an invalid timezone. */
export function formatFooterDate(
	epochMs: number,
	timezone: string,
	format: FooterDateFormat,
): string {
	if (format === "none" || !Number.isFinite(epochMs)) return "";
	try {
		if (format === "iso") {
			return new Intl.DateTimeFormat("en-CA", {
				timeZone: timezone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date(epochMs));
		}
		if (format === "dmy") {
			const parts = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				day: "2-digit",
				month: "short",
				year: "numeric",
			}).formatToParts(new Date(epochMs));
			const get = (type: string) =>
				parts.find((part) => part.type === type)?.value ?? "";
			return `${get("day")}-${get("month")}-${get("year")}`;
		}
		return new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			...DATE_OPTIONS[format],
		}).format(new Date(epochMs));
	} catch {
		return "";
	}
}

export type FooterBatteryState = { level: number; charging: boolean };

/** Battery level rounded to 5 (so the bar rarely changes) and a charging flag. */
export function footerBatteryState(
	voltage: number | null | undefined,
): FooterBatteryState | null {
	if (voltage == null || !Number.isFinite(voltage)) return null;
	const { batteryPercentage, isCharging } = estimateBatteryLife(voltage, 1);
	if (isCharging) return { level: 100, charging: true };
	return { level: Math.round(batteryPercentage / 5) * 5, charging: false };
}

/**
 * Battery text next to the battery icon. Percentages are rounded to the
 * nearest 5 so the bar does not change on every wake-up (a changed pixel costs
 * a partial refresh).
 */
export function formatFooterBattery(
	voltage: number | null | undefined,
	format: FooterBatteryFormat,
): string {
	if (format === "none") return "";
	const state = footerBatteryState(voltage);
	if (!state) return "";
	if (format === "voltage") return `${(voltage as number).toFixed(2)}V`;
	return state.charging ? "Charging" : `${state.level}%`;
}

export type FooterParts = {
	left: string;
	center: string;
	right: string;
	/** Level for the battery icon; null hides the icon. */
	batteryLevel: number | null;
	charging: boolean;
};

export function buildFooterParts(
	config: FooterConfig,
	context: { now: number; timezone: string; voltage: number | null },
): FooterParts {
	const right = formatFooterBattery(context.voltage, config.batteryFormat);
	const state = right ? footerBatteryState(context.voltage) : null;
	return {
		left: formatFooterDate(context.now, context.timezone, config.dateFormat),
		center: config.text,
		right,
		batteryLevel: state ? state.level : null,
		charging: state?.charging ?? false,
	};
}
