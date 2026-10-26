/// <reference types="jest" />
import {
	formatWeekdays,
	toggleWeekday,
	WEEKDAYS,
	weekdaysFrom,
} from "./weekdays";

describe("weekdaysFrom", () => {
	it("reads a range", () => {
		expect(weekdaysFrom("Mon-Fri")).toEqual([
			"Mon",
			"Tue",
			"Wed",
			"Thu",
			"Fri",
		]);
	});

	it("reads a list and ignores case and spaces", () => {
		expect(weekdaysFrom("fri, mon")).toEqual(["Mon", "Fri"]);
	});

	it("wraps a range over the weekend", () => {
		expect(weekdaysFrom("Sat-Mon")).toEqual(["Mon", "Sat", "Sun"]);
	});

	it("is empty for nothing recognisable", () => {
		expect(weekdaysFrom("")).toEqual([]);
		expect(weekdaysFrom("someday")).toEqual([]);
	});
});

describe("formatWeekdays", () => {
	it("joins in week order, Monday first", () => {
		expect(formatWeekdays(["Sun", "Fri", "Mon"])).toBe("Mon,Fri,Sun");
	});
});

describe("toggleWeekday", () => {
	it("adds a missing day and removes a present one", () => {
		expect(toggleWeekday("Mon,Tue", "Wed")).toBe("Mon,Tue,Wed");
		expect(toggleWeekday("Mon,Tue", "Mon")).toBe("Tue");
	});

	it("can empty the list", () => {
		expect(toggleWeekday("Mon", "Mon")).toBe("");
	});
});

it("lists the week Monday first", () => {
	expect(WEEKDAYS).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
});
