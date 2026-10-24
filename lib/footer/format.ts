import { estimateBatteryLife } from "@/utils/helpers";
import type {
	FooterBatteryFormat,
	FooterConfig,
	FooterDateFormat,
} from "./config";

const DATE_OPTIONS: Record<
	Exclude<FooterDateFormat, "none" | "iso">,
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
		return new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			...DATE_OPTIONS[format],
		}).format(new Date(epochMs));
	} catch {
		return "";
	}
}

const BAR_SEGMENTS = 4;

/**
 * Battery text. Percentages are rounded to the nearest 5 so the strip does not
 * change on every wake-up (a changed pixel costs a partial refresh).
 */
export function formatFooterBattery(
	voltage: number | null | undefined,
	format: FooterBatteryFormat,
): string {
	if (format === "none" || voltage == null || !Number.isFinite(voltage)) {
		return "";
	}
	if (format === "voltage") return `${voltage.toFixed(2)}V`;

	const { batteryPercentage, isCharging } = estimateBatteryLife(voltage, 1);
	if (isCharging) return "Charging";
	const rounded = Math.round(batteryPercentage / 5) * 5;
	if (format === "percent") return `${rounded}%`;

	const filled = Math.round((rounded / 100) * BAR_SEGMENTS);
	const bar = `${"#".repeat(filled)}${"-".repeat(BAR_SEGMENTS - filled)}`;
	return `[${bar}] ${rounded}%`;
}

export type FooterParts = { left: string; center: string; right: string };

export function buildFooterParts(
	config: FooterConfig,
	context: { now: number; timezone: string; voltage: number | null },
): FooterParts {
	return {
		left: formatFooterDate(context.now, context.timezone, config.dateFormat),
		center: config.text,
		right: formatFooterBattery(context.voltage, config.batteryFormat),
	};
}
