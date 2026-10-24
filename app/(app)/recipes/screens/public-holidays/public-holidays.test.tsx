/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import PublicHolidays from "./public-holidays";

const holidays = [
	{
		date: "2026-12-25",
		name: "Christmas Day",
		weekday: "Fri",
		daysUntil: 62,
		longWeekend: true,
	},
	{
		date: "2026-12-26",
		name: "Boxing Day",
		weekday: "Sat",
		daysUntil: 63,
		longWeekend: false,
	},
	{
		date: "2027-01-01",
		name: "New Year's Day",
		weekday: "Fri",
		daysUntil: 69,
		longWeekend: true,
	},
	{
		date: "2027-02-15",
		name: "Family Day",
		weekday: "Mon",
		daysUntil: 114,
		longWeekend: true,
	},
	{
		date: "2027-03-26",
		name: "Good Friday",
		weekday: "Fri",
		daysUntil: 153,
		longWeekend: true,
	},
	{
		date: "2027-05-24",
		name: "Victoria Day",
		weekday: "Mon",
		daysUntil: 212,
		longWeekend: true,
	},
	{
		date: "2027-07-01",
		name: "Canada Day",
		weekday: "Thu",
		daysUntil: 250,
		longWeekend: false,
	},
	{
		date: "2027-08-02",
		name: "Civic Holiday",
		weekday: "Mon",
		daysUntil: 282,
		longWeekend: true,
	},
];

const base = {
	province: "ON",
	provinceName: "Ontario",
	today: "2026-10-24",
	holidays,
	error: "",
};

const at = (width: number, height: number, over = {}) =>
	renderToStaticMarkup(
		<PublicHolidays {...base} {...over} width={width} height={height} />,
	);

describe("PublicHolidays", () => {
	it("names the province and lists the next holidays on a full screen", () => {
		const out = at(800, 446);
		expect(out).toContain("Ontario");
		expect(out).toContain(">Christmas Day<");
		expect(out).toContain(">Boxing Day<");
		expect(out).toContain("in 62 days");
		expect(out).toContain("Dec 25");
	});

	it("marks long weekends only where the holiday is on a Monday or Friday", () => {
		const out = at(800, 446);
		expect(out).toContain("Long weekend");
		// Boxing Day (Sat) has none: count equals the number of flagged shown rows.
		const flagged = holidays.slice(0, 7).filter((h) => h.longWeekend).length;
		expect((out.match(/Long weekend/g) ?? []).length).toBe(flagged);
	});

	it("shows fewer holidays in the smaller slots", () => {
		expect((at(800, 446).match(/data-holiday/g) ?? []).length).toBe(7);
		expect((at(400, 446).match(/data-holiday/g) ?? []).length).toBe(6);
		expect((at(800, 206).match(/data-holiday/g) ?? []).length).toBe(3);
		expect((at(400, 206).match(/data-holiday/g) ?? []).length).toBe(3);
	});

	it("says so when the holiday data cannot be loaded", () => {
		const out = at(800, 446, {
			holidays: [],
			error: "Can't load holiday data",
		});
		expect(out).toContain("Can&#x27;t load holiday data");
		expect(out).not.toContain("data-holiday");
	});

	it("says so when there is nothing coming up", () => {
		expect(at(800, 446, { holidays: [] })).toContain("No upcoming holidays");
	});

	it("words today and tomorrow", () => {
		const out = at(800, 446, {
			holidays: [
				{ ...holidays[0], daysUntil: 0 },
				{ ...holidays[1], daysUntil: 1 },
			],
		});
		expect(out).toContain(">Today<");
		expect(out).toContain(">Tomorrow<");
	});
});
