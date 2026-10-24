/// <reference types="jest" />
import {
	buildFooterParts,
	footerBatteryState,
	formatFooterBattery,
	formatFooterDate,
} from "./format";

// 2026-10-24 15:30 UTC is Sat 11:30 in Toronto (EDT, UTC-4).
const now = Date.UTC(2026, 9, 24, 15, 30);

describe("formatFooterDate", () => {
	const tz = "America/Toronto";

	it.each([
		["YYYY-MM-DD", "2026-10-24"],
		["YYYY-DD-MM", "2026-24-10"],
		["DD-MM-YYYY", "24-10-2026"],
		["MM-DD-YYYY", "10-24-2026"],
		["DD-MMM-YYYY", "24-Oct-2026"],
		["MMM D", "Oct 24"],
		["ddd, MMM D", "Sat, Oct 24"],
	] as const)("formats %s", (format, expected) => {
		expect(formatFooterDate(now, tz, format)).toBe(expected);
	});

	it("pads day and month in numeric formats but not in MMM D", () => {
		const first = Date.UTC(2026, 2, 5, 15, 0); // 5 Mar 2026
		expect(formatFooterDate(first, tz, "DD-MM-YYYY")).toBe("05-03-2026");
		expect(formatFooterDate(first, tz, "DD-MMM-YYYY")).toBe("05-Mar-2026");
		expect(formatFooterDate(first, tz, "MMM D")).toBe("Mar 5");
	});

	it("uses the timezone's date, not UTC's", () => {
		// 02:00 UTC on the 25th is still the 24th in Toronto.
		const late = Date.UTC(2026, 9, 25, 2, 0);
		expect(formatFooterDate(late, tz, "YYYY-MM-DD")).toBe("2026-10-24");
	});

	it("returns an empty string for none or a bad timezone", () => {
		expect(formatFooterDate(now, tz, "none")).toBe("");
		expect(formatFooterDate(now, "Not/AZone", "MMM D")).toBe("");
	});
});

describe("formatFooterBattery", () => {
	it("rounds the percentage to a whole number", () => {
		// 3.9V -> (3.9-3.6)/0.6 = 50%
		expect(formatFooterBattery(3.9, "percent")).toBe("50%");
		// 4.1V is 83.33% on the dashboard, so the footer shows 83%
		expect(formatFooterBattery(4.1, "percent")).toBe("83%");
		expect(formatFooterBattery(3.94, "percent")).toBe("57%");
		// 4.2V -> 100%
		expect(formatFooterBattery(4.2, "percent")).toBe("100%");
	});

	it("clamps below the cutoff to 0%", () => {
		expect(formatFooterBattery(3.4, "percent")).toBe("0%");
	});

	it("shows a charging mark above the charging voltage", () => {
		expect(formatFooterBattery(4.7, "percent")).toBe("Charging");
	});

	it("shows the raw voltage with two decimals", () => {
		expect(formatFooterBattery(3.923, "voltage")).toBe("3.92V");
	});

	it("treats the old icon-percent value as plain percent (the icon is always drawn)", () => {
		expect(formatFooterBattery(3.9, "icon-percent")).toBe("50%");
	});

	it("returns empty for none or an unknown voltage", () => {
		expect(formatFooterBattery(3.9, "none")).toBe("");
		expect(formatFooterBattery(null, "percent")).toBe("");
		expect(formatFooterBattery(Number.NaN, "percent")).toBe("");
	});
});

describe("footerBatteryState", () => {
	it("gives a whole-number level and no charging flag", () => {
		expect(footerBatteryState(3.9)).toEqual({ level: 50, charging: false });
		expect(footerBatteryState(4.1)).toEqual({ level: 83, charging: false });
		expect(footerBatteryState(4.2)).toEqual({ level: 100, charging: false });
		expect(footerBatteryState(3.4)).toEqual({ level: 0, charging: false });
	});

	it("flags charging above the charging voltage", () => {
		expect(footerBatteryState(4.7)).toEqual({ level: 100, charging: true });
	});

	it("returns null without a usable voltage", () => {
		expect(footerBatteryState(null)).toBeNull();
		expect(footerBatteryState(Number.NaN)).toBeNull();
	});
});

describe("buildFooterParts", () => {
	const config = {
		enabled: true,
		text: "Yin's board",
		dateFormat: "MMM D",
		batteryFormat: "percent",
	} as const;

	it("puts the date left, the text in the middle and the battery right", () => {
		expect(
			buildFooterParts(config, {
				now,
				timezone: "America/Toronto",
				voltage: 3.9,
			}),
		).toEqual({
			left: "Oct 24",
			center: "Yin's board",
			right: "50%",
			batteryLevel: 50,
			charging: false,
		});
	});

	it("leaves a part empty when its option is off", () => {
		expect(
			buildFooterParts(
				{ ...config, dateFormat: "none", batteryFormat: "none" },
				{ now, timezone: "America/Toronto", voltage: 3.9 },
			),
		).toEqual({
			left: "",
			center: "Yin's board",
			right: "",
			batteryLevel: null,
			charging: false,
		});
	});
});
