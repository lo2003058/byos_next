/// <reference types="jest" />
import {
	annualGross,
	earnings,
	type PayConfig,
	parsePayType,
	parseTime,
	parseWorkDays,
	workdayProgress,
} from "./pay";

const TZ = "Asia/Hong_Kong";
// Oct 2026 has 22 Mon-Fri workdays; 1 Oct is a Thursday.
const base: PayConfig = {
	payType: "monthly",
	amount: 22000,
	workDays: [1, 2, 3, 4, 5],
	startMinutes: 9 * 60,
	endMinutes: 18 * 60,
	breakMinutes: 60,
};
// Wed 21 Oct 2026 13:30 in Hong Kong = halfway through the 09:00-18:00 day.
const wedNoon = Date.UTC(2026, 9, 21, 5, 30);

describe("parsePayType", () => {
	it("accepts the four pay types in any case", () => {
		expect(parsePayType("Annual")).toBe("annual");
		expect(parsePayType(" hourly ")).toBe("hourly");
		expect(parsePayType("daily")).toBe("daily");
		expect(parsePayType("MONTHLY")).toBe("monthly");
	});

	it("falls back to monthly", () => {
		expect(parsePayType("weekly")).toBe("monthly");
		expect(parsePayType("")).toBe("monthly");
	});
});

describe("parseWorkDays", () => {
	it("reads a range", () => {
		expect(parseWorkDays("Mon-Fri")).toEqual([1, 2, 3, 4, 5]);
		expect(parseWorkDays("Mon-Sat")).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it("reads a list, in any order", () => {
		expect(parseWorkDays("Wed, mon,Fri")).toEqual([1, 3, 5]);
	});

	it("wraps a range over the weekend", () => {
		expect(parseWorkDays("Sat-Tue")).toEqual([0, 1, 2, 6]);
	});

	it("falls back to Mon-Fri when nothing is recognised", () => {
		expect(parseWorkDays("")).toEqual([1, 2, 3, 4, 5]);
		expect(parseWorkDays("whenever")).toEqual([1, 2, 3, 4, 5]);
	});
});

describe("parseTime", () => {
	it("reads HH:MM", () => {
		expect(parseTime("09:30", 0)).toBe(570);
		expect(parseTime("7:05", 0)).toBe(425);
	});

	it("uses the fallback for bad input", () => {
		expect(parseTime("25:00", 540)).toBe(540);
		expect(parseTime("nine", 540)).toBe(540);
	});
});

describe("earnings", () => {
	it("pays a monthly salary evenly over the month's workdays", () => {
		expect(earnings(base, wedNoon, TZ)).toEqual({
			today: 500,
			week: 2500,
			month: 14500,
		});
	});

	it("gives an annual salary the same pay as a twelfth per month", () => {
		const annual = { ...base, payType: "annual" as const, amount: 264000 };
		expect(earnings(annual, wedNoon, TZ)).toEqual(earnings(base, wedNoon, TZ));
	});

	it("pays a daily rate per workday", () => {
		const daily = { ...base, payType: "daily" as const, amount: 900 };
		expect(earnings(daily, wedNoon, TZ)).toEqual({
			today: 450,
			week: 2250,
			month: 14 * 900 + 450,
		});
	});

	it("pays hourly over the paid hours only", () => {
		const hourly = { ...base, payType: "hourly" as const, amount: 100 };
		// 8 paid hours = 800 a day, half done at 13:30.
		expect(earnings(hourly, wedNoon, TZ).today).toBe(400);
	});

	it("pays nothing before the day starts", () => {
		const early = Date.UTC(2026, 9, 21, 0, 0); // 08:00 HK
		expect(earnings(base, early, TZ).today).toBe(0);
		expect(earnings(base, early, TZ).week).toBe(2000);
	});

	it("pays the full day after it ends", () => {
		const late = Date.UTC(2026, 9, 21, 11, 0); // 19:00 HK
		expect(earnings(base, late, TZ)).toEqual({
			today: 1000,
			week: 3000,
			month: 15000,
		});
	});

	it("pays nothing today on a day off but keeps the week and month", () => {
		const sat = Date.UTC(2026, 9, 24, 5, 30);
		expect(earnings(base, sat, TZ)).toEqual({
			today: 0,
			week: 5000,
			month: 17000,
		});
	});

	it("uses the timezone's date, not UTC's", () => {
		// 17:00 UTC Sun 25 Oct is 01:00 Mon 26 Oct in Hong Kong: new week.
		const monEarly = Date.UTC(2026, 9, 25, 17, 0);
		expect(earnings(base, monEarly, TZ).week).toBe(0);
	});

	it("starts the month fresh on the 1st", () => {
		const oct1 = Date.UTC(2026, 9, 1, 11, 0); // Thu 1 Oct 19:00 HK
		expect(earnings(base, oct1, TZ).month).toBe(1000);
	});

	it("returns zeros when there are no workdays", () => {
		expect(earnings({ ...base, workDays: [] }, wedNoon, TZ)).toEqual({
			today: 0,
			week: 0,
			month: 0,
		});
	});
});

describe("workdayProgress", () => {
	it("is halfway through the day at 13:30", () => {
		expect(workdayProgress(base, wedNoon, TZ)).toEqual({
			state: "working",
			percent: 50,
			minutesLeft: 270,
		});
	});

	it("has not started before the start time", () => {
		const early = Date.UTC(2026, 9, 21, 0, 0); // 08:00 HK
		expect(workdayProgress(base, early, TZ)).toEqual({
			state: "before",
			percent: 0,
			minutesLeft: 540,
		});
	});

	it("is done after the end time", () => {
		const late = Date.UTC(2026, 9, 21, 11, 0); // 19:00 HK
		expect(workdayProgress(base, late, TZ)).toEqual({
			state: "done",
			percent: 100,
			minutesLeft: 0,
		});
	});

	it("is a day off on a non-workday", () => {
		const sat = Date.UTC(2026, 9, 24, 5, 30);
		expect(workdayProgress(base, sat, TZ)).toEqual({
			state: "off",
			percent: 0,
			minutesLeft: 0,
		});
	});
});

describe("annualGross", () => {
	it("scales each pay type to a year", () => {
		expect(annualGross(base)).toBe(264000);
		expect(annualGross({ ...base, payType: "annual", amount: 90000 })).toBe(
			90000,
		);
		expect(annualGross({ ...base, payType: "daily", amount: 900 })).toBe(
			900 * 5 * 52,
		);
		// 8 paid hours a day, 5 days a week.
		expect(annualGross({ ...base, payType: "hourly", amount: 100 })).toBe(
			100 * 8 * 5 * 52,
		);
	});
});
