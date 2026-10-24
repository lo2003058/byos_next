/// <reference types="jest" />
import {
	buildFooterParts,
	formatFooterBattery,
	formatFooterDate,
} from "./format";

// 2026-10-24 15:30 UTC is Sat 11:30 in Toronto (EDT, UTC-4).
const now = Date.UTC(2026, 9, 24, 15, 30);

describe("formatFooterDate", () => {
	it("formats in the device timezone", () => {
		expect(formatFooterDate(now, "America/Toronto", "short")).toBe("Oct 24");
		expect(formatFooterDate(now, "America/Toronto", "weekday-short")).toBe(
			"Sat, Oct 24",
		);
		expect(formatFooterDate(now, "America/Toronto", "iso")).toBe("2026-10-24");
	});

	it("uses the timezone's date, not UTC's", () => {
		// 02:00 UTC on the 25th is still the 24th in Toronto.
		const late = Date.UTC(2026, 9, 25, 2, 0);
		expect(formatFooterDate(late, "America/Toronto", "iso")).toBe("2026-10-24");
	});

	it("returns an empty string for none or a bad timezone", () => {
		expect(formatFooterDate(now, "America/Toronto", "none")).toBe("");
		expect(formatFooterDate(now, "Not/AZone", "short")).toBe("");
	});
});

describe("formatFooterBattery", () => {
	it("rounds the percentage to the nearest 5 so the strip rarely changes", () => {
		// 3.9V -> (3.9-3.6)/0.6 = 50%
		expect(formatFooterBattery(3.9, "percent")).toBe("50%");
		// 3.93V -> 55% exactly; 3.94V -> 56.67% -> 55%
		expect(formatFooterBattery(3.94, "percent")).toBe("55%");
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

	it("shows a bar plus percentage for icon-percent", () => {
		expect(formatFooterBattery(3.9, "icon-percent")).toBe("[##--] 50%");
	});

	it("returns empty for none or an unknown voltage", () => {
		expect(formatFooterBattery(3.9, "none")).toBe("");
		expect(formatFooterBattery(null, "percent")).toBe("");
		expect(formatFooterBattery(Number.NaN, "percent")).toBe("");
	});
});

describe("buildFooterParts", () => {
	const config = {
		enabled: true,
		text: "Yin's board",
		dateFormat: "short",
		batteryFormat: "percent",
	} as const;

	it("puts the date left, the text in the middle and the battery right", () => {
		expect(
			buildFooterParts(config, {
				now,
				timezone: "America/Toronto",
				voltage: 3.9,
			}),
		).toEqual({ left: "Oct 24", center: "Yin's board", right: "50%" });
	});

	it("leaves a part empty when its option is off", () => {
		expect(
			buildFooterParts(
				{ ...config, dateFormat: "none", batteryFormat: "none" },
				{ now, timezone: "America/Toronto", voltage: 3.9 },
			),
		).toEqual({ left: "", center: "Yin's board", right: "" });
	});
});
