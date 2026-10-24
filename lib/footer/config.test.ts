/// <reference types="jest" />
import {
	BATTERY_FORMATS,
	changedFooterFields,
	DATE_FORMATS,
	footerConfigSchema,
	normalizeFooterConfig,
	parseFooterColumns,
} from "./config";

describe("normalizeFooterConfig", () => {
	it("treats a device row without the new columns as off", () => {
		expect(normalizeFooterConfig({})).toEqual({
			enabled: false,
			text: "",
			dateFormat: "none",
			batteryFormat: "none",
		});
	});

	it("reads the stored columns", () => {
		expect(
			normalizeFooterConfig({
				global_footer_enabled: true,
				global_footer_text: "Yin's board",
				global_footer_date_format: "ddd, MMM D",
				global_footer_battery_format: "percent",
			}),
		).toEqual({
			enabled: true,
			text: "Yin's board",
			dateFormat: "ddd, MMM D",
			batteryFormat: "percent",
		});
	});

	it.each([
		["short", "MMM D"],
		["weekday-short", "ddd, MMM D"],
		["iso", "YYYY-MM-DD"],
		["dmy", "DD-MMM-YYYY"],
	])("reads the earlier stored value %s as %s", (stored, expected) => {
		expect(
			normalizeFooterConfig({ global_footer_date_format: stored }).dateFormat,
		).toBe(expected);
	});

	it("falls back to none for an unknown format", () => {
		expect(
			normalizeFooterConfig({
				global_footer_date_format: "banana",
				global_footer_battery_format: "banana",
			}),
		).toMatchObject({ dateFormat: "none", batteryFormat: "none" });
	});

	it("coerces null columns to defaults", () => {
		expect(
			normalizeFooterConfig({
				global_footer_enabled: null,
				global_footer_text: null,
			}),
		).toMatchObject({ enabled: false, text: "" });
	});
});

describe("footerConfigSchema", () => {
	const ok = {
		enabled: true,
		text: "Hi",
		dateFormat: DATE_FORMATS[0],
		batteryFormat: BATTERY_FORMATS[0],
	};

	it("accepts a valid config", () => {
		expect(footerConfigSchema.safeParse(ok).success).toBe(true);
	});

	it("rejects text over 40 characters", () => {
		expect(
			footerConfigSchema.safeParse({ ...ok, text: "x".repeat(41) }).success,
		).toBe(false);
	});

	it("rejects an unknown format", () => {
		expect(
			footerConfigSchema.safeParse({ ...ok, dateFormat: "nope" }).success,
		).toBe(false);
	});
});

describe("parseFooterColumns", () => {
	it("returns only the columns that were passed, validated", () => {
		expect(
			parseFooterColumns({
				global_footer_enabled: true,
				global_footer_text: "Hi",
			}),
		).toEqual({
			success: true,
			columns: { global_footer_enabled: true, global_footer_text: "Hi" },
		});
	});

	it("returns nothing for a patch without footer fields", () => {
		expect(parseFooterColumns({})).toEqual({ success: true, columns: {} });
	});

	it("reports an error instead of throwing on bad input", () => {
		const result = parseFooterColumns({ global_footer_text: "x".repeat(41) });
		expect(result.success).toBe(false);
		expect(result.success === false && result.error).toMatch(/40/);
		expect(
			parseFooterColumns({ global_footer_date_format: "nope" }).success,
		).toBe(false);
	});
});

describe("changedFooterFields", () => {
	const base = {
		global_footer_enabled: false,
		global_footer_text: "",
		global_footer_date_format: "none",
		global_footer_battery_format: "none",
	};

	it("is empty when nothing changed, so saving an unrelated setting never touches the footer columns", () => {
		expect(changedFooterFields(base, { ...base })).toEqual({});
	});

	it("returns only the fields that differ", () => {
		expect(
			changedFooterFields(base, {
				...base,
				global_footer_enabled: true,
				global_footer_text: "Hi",
			}),
		).toEqual({ global_footer_enabled: true, global_footer_text: "Hi" });
	});
});
