import { estimateBatteryLife } from "@/utils/helpers";
import type {
	FooterBatteryFormat,
	FooterConfig,
	FooterDateFormat,
} from "./config";

/** Date in the device's timezone; empty for "none" or an invalid timezone. */
export function formatFooterDate(
	epochMs: number,
	timezone: string,
	format: FooterDateFormat,
): string {
	if (format === "none" || !Number.isFinite(epochMs)) return "";
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			weekday: "short",
		}).formatToParts(new Date(epochMs));
		const monthName = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			month: "short",
		}).format(new Date(epochMs));
		const get = (type: string) =>
			parts.find((part) => part.type === type)?.value ?? "";
		const day = get("day");
		const values: Record<string, string> = {
			YYYY: get("year"),
			MM: get("month"),
			DD: day,
			MMM: monthName,
			D: String(Number(day)),
			ddd: get("weekday"),
		};
		// Longest tokens first so "MMM" is not read as "MM" + "M".
		return format.replace(
			/YYYY|MMM|MM|DD|ddd|D/g,
			(token) => values[token] ?? token,
		);
	} catch {
		return "";
	}
}

export type FooterBatteryState = { level: number; charging: boolean };

/** Battery level as a whole-number percentage (same estimate as the dashboard) and a charging flag. */
export function footerBatteryState(
	voltage: number | null | undefined,
): FooterBatteryState | null {
	if (voltage == null || !Number.isFinite(voltage)) return null;
	const { batteryPercentage, isCharging } = estimateBatteryLife(voltage, 1);
	if (isCharging) return { level: 100, charging: true };
	return { level: Math.round(batteryPercentage), charging: false };
}

/**
 * Battery text next to the battery icon, using the same estimate as the
 * dashboard, rounded to a whole percent.
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
