/// <reference types="jest" />
import { datesFrom, monthCells, toggleDate } from "./day-picker";

describe("datesFrom", () => {
	it("reads a comma list, sorted and de-duplicated", () => {
		expect(datesFrom("2026-10-12, 2026-10-05,2026-10-12")).toEqual([
			"2026-10-05",
			"2026-10-12",
		]);
	});

	it("drops anything that is not a real date", () => {
		expect(datesFrom("2026-02-30,nope,2026-13-01,2026-10-5")).toEqual([]);
		expect(datesFrom("")).toEqual([]);
	});
});

describe("toggleDate", () => {
	it("adds a date, keeping the order", () => {
		expect(toggleDate("2026-10-12", "2026-10-05")).toBe(
			"2026-10-05,2026-10-12",
		);
	});

	it("removes a date that is already there", () => {
		expect(toggleDate("2026-10-05,2026-10-12", "2026-10-05")).toBe(
			"2026-10-12",
		);
	});

	it("keeps dates from other months", () => {
		expect(toggleDate("2026-09-30", "2026-10-01")).toBe(
			"2026-09-30,2026-10-01",
		);
	});
});

describe("monthCells", () => {
	it("pads the first week so days sit under their weekday (Monday first)", () => {
		// 1 Oct 2026 is a Thursday: three blanks, then the 1st.
		const cells = monthCells(2026, 10);
		expect(cells.slice(0, 3)).toEqual([null, null, null]);
		expect(cells[3]).toEqual({ day: 1, date: "2026-10-01" });
		expect(cells).toHaveLength(3 + 31);
		expect(cells[cells.length - 1]).toEqual({ day: 31, date: "2026-10-31" });
	});

	it("starts with no padding when the 1st is a Monday", () => {
		expect(monthCells(2026, 6)[0]).toEqual({ day: 1, date: "2026-06-01" });
	});
});
