/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import YearProgress from "./year-progress";

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
];

const data = {
	year: 2026,
	dayOfYear: 297,
	daysInYear: 365,
	daysLeft: 68,
	percent: 81.4,
	jan1Weekday: 3,
	showHolidays: true,
	province: "ON",
	provinceName: "Ontario",
	holidays,
	holidayError: "",
};

const at = (width: number, height: number, over = {}) =>
	renderToStaticMarkup(
		<YearProgress {...data} {...over} width={width} height={height} />,
	);

const count = (html: string, pattern: string) =>
	(html.match(new RegExp(pattern, "g")) ?? []).length;

describe("YearProgress", () => {
	it.each([
		["full", 800, 446],
		["half", 400, 446],
		["banner", 800, 206],
		["quarter", 400, 206],
	])("shows the headline numbers in a %s slot", (_name, width, height) => {
		const out = at(width, height);
		expect(out).toContain(">81.4%<");
		expect(out).toContain("68 days left");
		expect(out).toContain("297");
		expect(out).toContain("365");
	});

	it("draws the dot grid in the tall slots and a progress bar in the short ones", () => {
		for (const [width, height] of [
			[800, 446],
			[400, 446],
		]) {
			const out = at(width, height);
			for (const month of ["Jan", "Jun", "Oct", "Dec"]) {
				expect(out).toContain(`>${month}<`);
			}
		}
		expect(count(at(800, 446), 'data-today="true"')).toBe(1);
		for (const [width, height] of [
			[800, 206],
			[400, 206],
		]) {
			const out = at(width, height);
			expect(out).not.toContain(">Jan<");
			expect(out).toContain('data-testid="progress-bar"');
		}
	});

	it("lists the next holidays beside the dots, fewer in smaller slots", () => {
		const full = at(800, 446);
		expect(full).toContain("Public holidays");
		expect(full).toContain("Ontario");
		expect(full).toContain(">Christmas Day<");
		expect(full).toContain("in 62 days");
		expect(count(full, "data-holiday")).toBe(5);
		expect(count(at(400, 446), "data-holiday")).toBe(3);
		expect(count(at(800, 206), "data-holiday")).toBe(3);
		expect(count(at(400, 206), "data-holiday")).toBe(2);
	});

	it("marks long weekends only on Monday or Friday holidays", () => {
		const full = at(800, 446);
		// Of the first five, Boxing Day (Sat) is the only one without it.
		expect(count(full, "Long weekend")).toBe(4);
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

	it("leaves out the holidays when switched off, keeping the dots", () => {
		const out = at(800, 446, { showHolidays: false });
		expect(out).not.toContain("data-holiday");
		expect(out).not.toContain("Public holidays");
		expect(out).toContain(">Jan<");
	});

	it("says so when the holiday data cannot be loaded, without hiding the progress", () => {
		const out = at(800, 446, {
			holidays: [],
			holidayError: "Can't load holiday data",
		});
		expect(out).toContain("Can&#x27;t load holiday data");
		expect(out).toContain(">81.4%<");
		expect(out).not.toContain("data-holiday");
	});

	it("says so when there is nothing coming up", () => {
		expect(at(800, 446, { holidays: [] })).toContain("No upcoming holidays");
	});
});
