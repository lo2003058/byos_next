/// <reference types="jest" />
// PreSatori pulls in the browser rasterizer; the layout is all we test here.
jest.mock("@/utils/pre-satori", () => ({
	PreSatori: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderToStaticMarkup } from "react-dom/server";
import WeatherYin from "./weather-yin";

const base = {
	temperature: "14",
	feelsLike: "11",
	humidity: "68",
	windSpeed: "13",
	pressure: "1012",
	sunrise: "07:43",
	sunset: "18:19",
	highTemp: "14",
	lowTemp: "3",
	location: "Toronto, Canada",
	lastUpdated: "Oct 24, 14:00",
};

function html(show?: Record<string, boolean>) {
	return renderToStaticMarkup(<WeatherYin {...base} show={show} />);
}

describe("WeatherYin show flags", () => {
	it("shows every stat by default", () => {
		const out = html();
		for (const label of [
			"High",
			"Low",
			"Feels Like",
			"Humidity",
			"Wind Speed",
			"Pressure",
			"Sunrise",
			"Sunset",
		]) {
			expect(out).toContain(label);
		}
	});

	it("hides stats whose flag is off", () => {
		const out = html({ showHumidity: false, showPressure: false });
		expect(out).not.toContain("Humidity");
		expect(out).not.toContain("Pressure");
		expect(out).toContain("Wind Speed");
	});

	it("still renders the footer when every stat is off", () => {
		const out = html({
			showFeelsLike: false,
			showHumidity: false,
			showWind: false,
			showPressure: false,
			showSunrise: false,
			showSunset: false,
		});
		expect(out).not.toContain("Feels Like");
		expect(out).toContain("Toronto, Canada");
	});

	describe("high and low", () => {
		it("are tiles in the grid, not a line next to the icon", () => {
			const out = html();
			expect(out).not.toContain("high-low");
			expect(out).toContain(">High<");
			expect(out).toContain(">Low<");
		});

		it("are hidden together when switched off", () => {
			const out = html({ showHighLow: false });
			expect(out).not.toContain(">High<");
			expect(out).not.toContain(">Low<");
		});

		it("also appear on a half screen", () => {
			const out = renderToStaticMarkup(
				<WeatherYin {...base} width={400} height={480} />,
			);
			expect(out).toContain(">High<");
			expect(out).toContain(">Low<");
		});
	});

	describe("footer", () => {
		const footer = () =>
			renderToStaticMarkup(
				<WeatherYin {...base} suggestion="Cool, wear a jumper" />,
			);

		it("does not show the suggestion", () => {
			expect(footer()).not.toContain("wear a jumper");
		});

		it('puts the location on the left and "Updated <time>" on the right', () => {
			const out = footer();
			expect(out.indexOf("Toronto, Canada")).toBeGreaterThan(-1);
			expect(out.lastIndexOf("Toronto, Canada")).toBeLessThan(
				out.lastIndexOf("Updated 14:00"),
			);
		});

		it("shows the location alone when there is no date", () => {
			const out = renderToStaticMarkup(<WeatherYin {...base} lastUpdated="" />);
			expect(out).toContain("Toronto, Canada");
		});
	});

	describe("short slots (mixup banner and quarters)", () => {
		const at = (
			width: number,
			height: number,
			show?: Record<string, boolean>,
		) =>
			renderToStaticMarkup(
				<WeatherYin {...base} width={width} height={height} show={show} />,
			);

		it("banner keeps every stat and the footer", () => {
			const out = at(800, 240);
			for (const label of ["High", "Low", "Feels Like", "Sunset"]) {
				expect(out).toContain(`>${label}<`);
			}
			expect(out).toContain("Toronto, Canada");
		});

		it("quarter shows only the first four stats and the footer", () => {
			const out = at(400, 240);
			for (const label of ["High", "Low", "Feels Like", "Humidity"]) {
				expect(out).toContain(`>${label}<`);
			}
			expect(out).not.toContain(">Wind Speed<");
			expect(out).toContain("Toronto, Canada");
		});

		it("quarter falls back to the next enabled stats when high/low is off", () => {
			const out = at(400, 240, { showHighLow: false });
			expect(out).not.toContain(">High<");
			for (const label of [
				"Feels Like",
				"Humidity",
				"Wind Speed",
				"Pressure",
			]) {
				expect(out).toContain(`>${label}<`);
			}
			expect(out).not.toContain(">Sunrise<");
		});
	});
});
