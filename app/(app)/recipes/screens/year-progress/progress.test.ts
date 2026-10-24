/// <reference types="jest" />
import { yearMonthGrid, yearProgress } from "./progress";

// 2026-10-24 15:30 UTC = Sat 24 Oct 11:30 in Toronto.
const now = Date.UTC(2026, 9, 24, 15, 30);

describe("yearProgress", () => {
	it("counts the day of the year in the device timezone", () => {
		expect(yearProgress(now, "America/Toronto")).toEqual({
			year: 2026,
			dayOfYear: 297,
			daysInYear: 365,
			daysLeft: 68,
			percent: 81.4,
			jan1Weekday: 3, // 1 Jan 2026 is a Thursday (Mon=0)
		});
	});

	it("uses the timezone's date near midnight, not UTC's", () => {
		// 03:00 UTC on 1 Jan 2027 is still 31 Dec 2026 in Toronto.
		const edge = Date.UTC(2027, 0, 1, 3, 0);
		const result = yearProgress(edge, "America/Toronto");
		expect(result.year).toBe(2026);
		expect(result.dayOfYear).toBe(365);
		expect(result.daysLeft).toBe(0);
		expect(result.percent).toBe(100);
	});

	it("handles a leap year", () => {
		const result = yearProgress(Date.UTC(2028, 11, 31, 12, 0), "UTC");
		expect(result.daysInYear).toBe(366);
		expect(result.dayOfYear).toBe(366);
	});

	it("starts at day 1 on 1 January", () => {
		const result = yearProgress(Date.UTC(2026, 0, 1, 12, 0), "UTC");
		expect(result.dayOfYear).toBe(1);
		expect(result.daysLeft).toBe(364);
		expect(result.percent).toBe(0.3);
	});

	it("falls back to UTC for a bad timezone", () => {
		expect(yearProgress(now, "Not/AZone").year).toBe(2026);
	});
});

describe("yearMonthGrid", () => {
	const base = {
		year: 2026,
		dayOfYear: 297, // 24 Oct
		daysInYear: 365,
		daysLeft: 68,
		percent: 81.4,
		jan1Weekday: 3,
	};

	it("has one row per month with its length", () => {
		const months = yearMonthGrid(base);
		expect(months).toHaveLength(12);
		expect(months.map((m) => m.label).slice(0, 3)).toEqual([
			"Jan",
			"Feb",
			"Mar",
		]);
		expect(months[1].days).toBe(28);
		expect(months[0].days).toBe(31);
	});

	it("uses 29 days for February in a leap year", () => {
		const months = yearMonthGrid({ ...base, year: 2028, daysInYear: 366 });
		expect(months[1].days).toBe(29);
	});

	it("marks earlier months fully done, later months not at all", () => {
		const months = yearMonthGrid(base);
		expect(months[0]).toMatchObject({ doneDays: 31, todayDay: null });
		expect(months[8]).toMatchObject({ doneDays: 30, todayDay: null }); // Sep
		expect(months[10]).toMatchObject({ doneDays: 0, todayDay: null }); // Nov
	});

	it("marks the current month's days before today as done, and today", () => {
		expect(yearMonthGrid(base)[9]).toMatchObject({
			doneDays: 23,
			todayDay: 24,
		});
	});

	it("handles the first and last day of the year", () => {
		const first = yearMonthGrid({ ...base, dayOfYear: 1 });
		expect(first[0]).toMatchObject({ doneDays: 0, todayDay: 1 });
		const last = yearMonthGrid({ ...base, dayOfYear: 365 });
		expect(last[11]).toMatchObject({ doneDays: 30, todayDay: 31 });
	});
});
