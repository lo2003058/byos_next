/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import SalaryTicker, { definition } from "./salary-ticker";

const data = {
	currency: "$",
	taxRate: 10,
	payType: "monthly",
	today: { gross: 500, net: 450 },
	week: { gross: 2500, net: 2250 },
	month: { gross: 14500, net: 13050 },
	updatedAt: "13:30",
};

describe("SalaryTicker", () => {
	it("shows before-tax and after-tax amounts for today, week and month", () => {
		const html = renderToStaticMarkup(
			<SalaryTicker
				{...data}
				screen={createScreenProfile({ width: 800, height: 480 })}
			/>,
		);
		for (const text of [
			"Before tax",
			"After tax (10%)",
			"$500",
			"$450",
			"$2,500",
			"$2,250",
			"$14,500",
			"$13,050",
		]) {
			expect(html).toContain(text);
		}
	});

	it("shows only today in a quarter slot", () => {
		const html = renderToStaticMarkup(
			<SalaryTicker
				{...data}
				screen={createScreenProfile({ width: 400, height: 240 })}
			/>,
		);
		expect(html).toContain("$500");
		expect(html).toContain("$450 after tax");
		expect(html).not.toContain("This week");
	});
});

describe("definition.getData", () => {
	it("computes gross and net from the params", async () => {
		const params = definition.paramsSchema.parse({
			payType: "daily",
			amount: 1000,
			taxRate: 20,
			workDays: "Mon-Sun",
			startTime: "00:00",
			endTime: "23:59",
		});
		const result = await definition.getData?.(params, {
			deviceTimezone: "UTC",
		} as never);
		expect(result?.payType).toBe("daily");
		expect(result?.today.net).toBeCloseTo((result?.today.gross ?? 0) * 0.8, 1);
		expect(result?.month.gross).toBeGreaterThanOrEqual(1000);
	});
});
