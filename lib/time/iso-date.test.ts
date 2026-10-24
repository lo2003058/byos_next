/// <reference types="jest" />
import { isoDateIn } from "./iso-date";

describe("isoDateIn", () => {
	// 2026-10-24 15:30 UTC is still 24 Oct in Toronto.
	const now = Date.UTC(2026, 9, 24, 15, 30);

	it("returns the calendar date in the timezone", () => {
		expect(isoDateIn(now, "America/Toronto")).toBe("2026-10-24");
		expect(isoDateIn(now, "Asia/Tokyo")).toBe("2026-10-25");
	});

	it("uses the timezone's date, not UTC's, near midnight", () => {
		expect(isoDateIn(Date.UTC(2027, 0, 1, 3, 0), "America/Toronto")).toBe(
			"2026-12-31",
		);
	});

	it("falls back to UTC for a bad timezone", () => {
		expect(isoDateIn(now, "Not/AZone")).toBe("2026-10-24");
	});
});
