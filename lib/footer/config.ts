import { z } from "zod";

/** The stored value is the pattern itself (YYYY year, MM month, DD day, MMM month name, ddd weekday). */
export const DATE_FORMATS = [
	"none",
	"YYYY-MM-DD",
	"YYYY-DD-MM",
	"DD-MM-YYYY",
	"MM-DD-YYYY",
	"DD-MMM-YYYY",
	"MMM D",
	"ddd, MMM D",
] as const;

/** Values stored before the pattern names, still read as their pattern. */
const LEGACY_DATE_FORMATS: Record<string, (typeof DATE_FORMATS)[number]> = {
	short: "MMM D",
	"weekday-short": "ddd, MMM D",
	iso: "YYYY-MM-DD",
	dmy: "DD-MMM-YYYY",
};

export const BATTERY_FORMATS = [
	"none",
	"percent", // 85%
	"icon-percent", // [####] 85%
	"voltage", // 3.92V
] as const;

export type FooterDateFormat = (typeof DATE_FORMATS)[number];
export type FooterBatteryFormat = (typeof BATTERY_FORMATS)[number];

export const DATE_FORMAT_LABELS: Record<FooterDateFormat, string> = {
	none: "Hidden",
	"YYYY-MM-DD": "YYYY-MM-DD",
	"YYYY-DD-MM": "YYYY-DD-MM",
	"DD-MM-YYYY": "DD-MM-YYYY",
	"MM-DD-YYYY": "MM-DD-YYYY",
	"DD-MMM-YYYY": "DD-MMM-YYYY",
	"MMM D": "MMM D",
	"ddd, MMM D": "ddd, MMM D",
};

/** Battery formats offered in the UI. `icon-percent` is kept only so stored values still read. */
export const BATTERY_FORMAT_OPTIONS = ["none", "percent", "voltage"] as const;

export const BATTERY_FORMAT_LABELS: Record<FooterBatteryFormat, string> = {
	none: "Hidden",
	percent: "85%",
	"icon-percent": "85%",
	voltage: "3.92V",
};

export const FOOTER_TEXT_MAX_LENGTH = 40;

export const footerConfigSchema = z.object({
	enabled: z.boolean(),
	text: z.string().max(FOOTER_TEXT_MAX_LENGTH),
	dateFormat: z.enum(DATE_FORMATS),
	batteryFormat: z.enum(BATTERY_FORMATS),
});

export type FooterConfig = z.infer<typeof footerConfigSchema>;

type FooterColumns = {
	global_footer_enabled?: boolean | null;
	global_footer_text?: string | null;
	global_footer_date_format?: string | null;
	global_footer_battery_format?: string | null;
};

const pick = <T extends string>(
	allowed: readonly T[],
	value: string | null | undefined,
	fallback: T,
): T =>
	(allowed as readonly string[]).includes(value ?? "")
		? (value as T)
		: fallback;

/**
 * Reads the footer settings off a device row. Missing columns (the migration
 * has not been applied yet) and unknown values mean "off".
 */
export function normalizeFooterConfig(row: FooterColumns): FooterConfig {
	return {
		enabled: row.global_footer_enabled === true,
		text: (row.global_footer_text ?? "").slice(0, FOOTER_TEXT_MAX_LENGTH),
		dateFormat: pick(
			DATE_FORMATS,
			LEGACY_DATE_FORMATS[row.global_footer_date_format ?? ""] ??
				row.global_footer_date_format,
			"none",
		),
		batteryFormat: pick(
			BATTERY_FORMATS,
			row.global_footer_battery_format,
			"none",
		),
	};
}

type FooterColumnPatch = FooterColumns & Record<string, unknown>;

export type ParsedFooterColumns =
	| { success: true; columns: Record<string, unknown> }
	| { success: false; error: string };

/** Validates the footer columns present in a device patch; absent ones are skipped. */
export function parseFooterColumns(
	patch: FooterColumnPatch,
): ParsedFooterColumns {
	const checks = [
		["global_footer_enabled", footerConfigSchema.shape.enabled],
		["global_footer_text", footerConfigSchema.shape.text],
		["global_footer_date_format", footerConfigSchema.shape.dateFormat],
		["global_footer_battery_format", footerConfigSchema.shape.batteryFormat],
	] as const;

	const columns: Record<string, unknown> = {};
	for (const [column, schema] of checks) {
		const value = patch[column];
		if (value === undefined) continue;
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			const reason =
				column === "global_footer_text"
					? `Footer text must be at most ${FOOTER_TEXT_MAX_LENGTH} characters`
					: `Invalid footer setting: ${column}`;
			return { success: false, error: reason };
		}
		columns[column] = parsed.data;
	}
	return { success: true, columns };
}

const FOOTER_COLUMN_KEYS = [
	"global_footer_enabled",
	"global_footer_text",
	"global_footer_date_format",
	"global_footer_battery_format",
] as const;

/**
 * The footer columns whose value differs between two device snapshots. A save
 * only sends these, so changing an unrelated setting never writes columns an
 * older database may not have yet.
 */
export function changedFooterFields<
	T extends Partial<Record<(typeof FOOTER_COLUMN_KEYS)[number], unknown>>,
>(
	original: T,
	edited: T,
): Partial<Pick<T, (typeof FOOTER_COLUMN_KEYS)[number]>> {
	const changed: Record<string, unknown> = {};
	for (const key of FOOTER_COLUMN_KEYS) {
		if (edited[key] !== original[key]) changed[key] = edited[key];
	}
	return changed as Partial<Pick<T, (typeof FOOTER_COLUMN_KEYS)[number]>>;
}
