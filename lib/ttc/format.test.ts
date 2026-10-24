/// <reference types="jest" />
import { formatClock } from "./format";

describe("formatClock", () => {
	// 2026-10-24 12:07 UTC is 08:07 in Toronto (EDT, UTC-4).
	const noonish = Date.UTC(2026, 9, 24, 12, 7);

	it("formats in the requested timezone as 24-hour HH:mm", () => {
		expect(formatClock(noonish, "America/Toronto")).toBe("08:07");
		expect(formatClock(Date.UTC(2026, 9, 24, 21, 45), "America/Toronto")).toBe(
			"17:45",
		);
	});

	it("handles midnight and noon", () => {
		expect(formatClock(Date.UTC(2026, 9, 24, 4, 5), "America/Toronto")).toBe(
			"00:05",
		);
		expect(formatClock(Date.UTC(2026, 9, 24, 16, 0), "America/Toronto")).toBe(
			"12:00",
		);
	});

	it("returns an empty string for an invalid timezone or time", () => {
		expect(formatClock(noonish, "Not/AZone")).toBe("");
		expect(formatClock(Number.NaN, "America/Toronto")).toBe("");
	});
});
