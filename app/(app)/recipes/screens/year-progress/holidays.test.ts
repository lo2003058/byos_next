/// <reference types="jest" />
import {
	daysUntilLabel,
	holidayDisplayName,
	normalizeProvince,
	PROVINCE_NAMES,
	parseNagerHolidays,
	selectUpcomingHolidays,
	shortDate,
} from "./holidays";

const holidays = [
	{ date: "2026-01-01", name: "New Year's Day", counties: null },
	{ date: "2026-02-16", name: "Family Day", counties: ["CA-AB", "CA-ON"] },
	{ date: "2026-02-16", name: "Louis Riel Day", counties: ["CA-MB"] },
	{ date: "2026-04-03", name: "Good Friday", counties: null },
	{ date: "2026-08-03", name: "Civic Holiday", counties: ["CA-ON", "CA-MB"] },
	{ date: "2026-10-12", name: "Thanksgiving", counties: null },
	{ date: "2026-11-11", name: "Remembrance Day", counties: ["CA-AB"] },
	{ date: "2026-12-25", name: "Christmas Day", counties: null },
	{ date: "2026-12-26", name: "St. Stephen's Day", counties: ["CA-ON"] },
	{ date: "2027-01-01", name: "New Year's Day", counties: null },
	{ date: "2027-02-15", name: "Family Day", counties: ["CA-ON"] },
];

describe("normalizeProvince", () => {
	it("accepts any case and surrounding spaces", () => {
		expect(normalizeProvince(" bc ")).toBe("BC");
		expect(normalizeProvince("qc")).toBe("QC");
	});

	it("falls back to ON for an unknown or empty code", () => {
		expect(normalizeProvince("XX")).toBe("ON");
		expect(normalizeProvince("")).toBe("ON");
		expect(normalizeProvince("Ontario")).toBe("ON");
	});

	it("names every province and territory", () => {
		expect(Object.keys(PROVINCE_NAMES).sort()).toEqual(
			[
				"AB",
				"BC",
				"MB",
				"NB",
				"NL",
				"NS",
				"NT",
				"NU",
				"ON",
				"PE",
				"QC",
				"SK",
				"YT",
			].sort(),
		);
	});
});

describe("selectUpcomingHolidays", () => {
	const today = "2026-10-24"; // Saturday

	it("keeps national holidays and the province's own, from today on", () => {
		const result = selectUpcomingHolidays(holidays, "ON", today, 10);
		expect(result.map((h) => h.name)).toEqual([
			"Christmas Day",
			"Boxing Day",
			"New Year's Day",
			"Family Day",
		]);
	});

	it("drops holidays that belong to other provinces", () => {
		const result = selectUpcomingHolidays(holidays, "ON", "2026-01-01", 20);
		const names = result.map((h) => h.name);
		expect(names).not.toContain("Louis Riel Day");
		expect(names).not.toContain("Remembrance Day");
		expect(names).toContain("Civic Holiday");
	});

	it("includes today itself", () => {
		const result = selectUpcomingHolidays(holidays, "ON", "2026-10-12", 3);
		expect(result[0]).toMatchObject({ name: "Thanksgiving", daysUntil: 0 });
	});

	it("counts days until each holiday and names the weekday", () => {
		const [first] = selectUpcomingHolidays(holidays, "ON", today, 1);
		expect(first).toMatchObject({
			date: "2026-12-25",
			weekday: "Fri",
			daysUntil: 62,
		});
	});

	it("flags Monday and Friday holidays as long weekends", () => {
		const result = selectUpcomingHolidays(holidays, "ON", today, 10);
		expect(result.find((h) => h.name === "Christmas Day")?.longWeekend).toBe(
			true,
		); // Fri
		expect(result.find((h) => h.name === "Boxing Day")?.longWeekend).toBe(
			false,
		); // Sat
		expect(result.find((h) => h.name === "Family Day")?.longWeekend).toBe(true); // Mon
		expect(result.find((h) => h.name === "New Year's Day")?.longWeekend).toBe(
			true,
		); // Fri 2027-01-01
	});

	it("respects the limit and keeps date order", () => {
		const result = selectUpcomingHolidays(holidays, "ON", "2026-01-01", 2);
		expect(result.map((h) => h.date)).toEqual(["2026-01-01", "2026-02-16"]);
	});

	it("does not list the same holiday twice", () => {
		const doubled = [...holidays, ...holidays];
		const result = selectUpcomingHolidays(doubled, "ON", today, 10);
		expect(result).toHaveLength(4);
	});

	it("returns an empty list when nothing is left", () => {
		expect(selectUpcomingHolidays(holidays, "ON", "2030-01-01", 5)).toEqual([]);
	});
});

describe("holidayDisplayName", () => {
	it("calls Dec 26 Boxing Day, as it is known in Canada", () => {
		expect(holidayDisplayName("St. Stephen's Day")).toBe("Boxing Day");
	});

	it("leaves other names unchanged", () => {
		expect(holidayDisplayName("Family Day")).toBe("Family Day");
	});
});

describe("parseNagerHolidays", () => {
	it("keeps well-formed entries", () => {
		expect(
			parseNagerHolidays([
				{ date: "2026-07-01", name: "Canada Day", counties: null },
				{
					date: "2026-02-16",
					name: "Family Day",
					counties: ["CA-ON"],
					extra: 1,
				},
			]),
		).toEqual([
			{ date: "2026-07-01", name: "Canada Day", counties: null },
			{ date: "2026-02-16", name: "Family Day", counties: ["CA-ON"] },
		]);
	});

	it("drops malformed entries instead of failing", () => {
		expect(
			parseNagerHolidays([
				{ date: "not a date", name: "Bad" },
				{ date: "2026-07-01" },
				null,
				{ date: "2026-07-01", name: "Canada Day", counties: null },
			]),
		).toEqual([{ date: "2026-07-01", name: "Canada Day", counties: null }]);
	});

	it("returns an empty list for a non-array response", () => {
		expect(parseNagerHolidays({ error: "x" })).toEqual([]);
		expect(parseNagerHolidays(null)).toEqual([]);
	});
});

describe("daysUntilLabel", () => {
	it("words today, tomorrow and later days", () => {
		expect(daysUntilLabel(0)).toBe("Today");
		expect(daysUntilLabel(1)).toBe("Tomorrow");
		expect(daysUntilLabel(2)).toBe("in 2 days");
		expect(daysUntilLabel(62)).toBe("in 62 days");
	});
});

describe("shortDate", () => {
	it("gives month and day without a leading zero", () => {
		expect(shortDate("2026-12-25")).toBe("Dec 25");
		expect(shortDate("2027-02-05")).toBe("Feb 5");
	});
});
