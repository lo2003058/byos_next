/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import SalaryTicker, { definition, formatDuration } from "./salary-ticker";

const data = {
	currency: "$",
	provinceName: "Ontario",
	takeHomePercent: 78,
	payType: "monthly",
	today: { gross: 500, net: 390 },
	week: { gross: 2500, net: 1950 },
	month: { gross: 14500, net: 11310 },
	updatedAt: "13:30",
	startTime: "09:00",
	endTime: "18:00",
	dayState: "working" as const,
	dayPercent: 50,
	minutesLeft: 270,
};

const full = createScreenProfile({ width: 800, height: 480 });
const quarter = createScreenProfile({ width: 400, height: 240 });

describe("formatDuration", () => {
	it("writes hours and minutes", () => {
		expect(formatDuration(270)).toBe("4h 30m");
		expect(formatDuration(120)).toBe("2h");
		expect(formatDuration(45)).toBe("45m");
	});
});

describe("SalaryTicker", () => {
	it("shows before-tax and after-tax amounts for today, week and month", () => {
		const html = renderToStaticMarkup(<SalaryTicker {...data} screen={full} />);
		for (const text of [
			"Before tax",
			"After tax (78%)",
			"$500",
			"$390",
			"$2,500",
			"$1,950",
			"$14,500",
			"$11,310",
		]) {
			expect(html).toContain(text);
		}
	});

	it("shows how far through the day it is and when work ends", () => {
		const html = renderToStaticMarkup(<SalaryTicker {...data} screen={full} />);
		expect(html).toContain("50% · off at 18:00 · 4h 30m left");
	});

	it("draws one dot per half hour, with the right ones filled", () => {
		const html = renderToStaticMarkup(<SalaryTicker {...data} screen={full} />);
		// 09:00-18:00 is 18 dots; half way means 9 done, 1 under way, 8 to come.
		expect(html.match(/data-today="true"/g)).toHaveLength(1);
		expect(html.match(/background-color:#000/g)).toHaveLength(9);
	});

	it("says so on a day off", () => {
		const html = renderToStaticMarkup(
			<SalaryTicker {...data} dayState="off" dayPercent={0} screen={full} />,
		);
		expect(html).toContain("Day off");
		expect(html).not.toContain('data-today="true"');
	});

	it("fills every dot once the day is done", () => {
		const html = renderToStaticMarkup(
			<SalaryTicker
				{...data}
				dayState="done"
				dayPercent={100}
				minutesLeft={0}
				screen={full}
			/>,
		);
		expect(html).toContain("Done for today");
		expect(html.match(/background-color:#000/g)).toHaveLength(18);
	});

	it("shows only today, with the dots, in a quarter slot", () => {
		const html = renderToStaticMarkup(
			<SalaryTicker {...data} screen={quarter} />,
		);
		expect(html).toContain("$500");
		expect(html).toContain("$390 after tax");
		expect(html).toContain("off at 18:00");
		expect(html).not.toContain("This week");
	});
});

describe("definition.getData", () => {
	it("works out gross and after-tax pay from the params", async () => {
		const params = definition.paramsSchema.parse({
			payType: "annual",
			amount: 60000,
			province: "ON",
			currency: "HKD",
			workDays: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
			startTime: "00:00",
			endTime: "23:30",
		});
		const result = await definition.getData?.(params, {
			deviceTimezone: "UTC",
		} as never);
		expect(result?.currency).toBe("HK$");
		expect(result?.provinceName).toBe("Ontario");
		// $60,000 in Ontario keeps about 78.9% after tax, CPP and EI.
		expect(result?.takeHomePercent).toBe(79);
		expect(result?.month.net).toBeCloseTo(
			(result?.month.gross ?? 0) * 0.789,
			-1,
		);
	});

	it("falls back to Ontario for an unknown province", async () => {
		const params = definition.paramsSchema.parse({ province: "ZZ" });
		const result = await definition.getData?.(params, {
			deviceTimezone: "UTC",
		} as never);
		expect(result?.provinceName).toBe("Ontario");
	});
});
