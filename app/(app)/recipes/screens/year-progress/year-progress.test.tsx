/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import YearProgress from "./year-progress";

const data = {
	year: 2026,
	dayOfYear: 297,
	daysInYear: 365,
	daysLeft: 68,
	percent: 81.4,
	jan1Weekday: 3,
};

const at = (width: number, height: number) =>
	renderToStaticMarkup(
		<YearProgress {...data} width={width} height={height} />,
	);

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

	it("draws a row for every month in the tall slots", () => {
		for (const [width, height] of [
			[800, 446],
			[400, 446],
		]) {
			const out = at(width, height);
			for (const month of ["Jan", "Jun", "Oct", "Dec"]) {
				expect(out).toContain(`>${month}<`);
			}
		}
	});

	it("marks exactly one day as today in the month grid", () => {
		expect((at(800, 446).match(/data-today="true"/g) ?? []).length).toBe(1);
	});

	it("uses a progress bar instead of the month grid in the short slots", () => {
		for (const [width, height] of [
			[800, 206],
			[400, 206],
		]) {
			const out = at(width, height);
			expect(out).not.toContain(">Jan<");
			expect(out).toContain('data-testid="progress-bar"');
		}
	});

	it("shows the year", () => {
		expect(at(800, 446)).toContain("2026");
	});
});
