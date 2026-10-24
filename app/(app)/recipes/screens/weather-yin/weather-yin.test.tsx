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

	describe("on a half screen", () => {
		const half = (show?: Record<string, boolean>) =>
			renderToStaticMarkup(
				<WeatherYin {...base} width={400} height={480} show={show} />,
			);

		it("still shows the high and low temperature", () => {
			const out = half();
			expect(out).toContain("14°");
			expect(out).toContain("3°");
			expect(out).toContain('data-testid="high-low"');
		});

		it("hides high and low when switched off", () => {
			expect(half({ showHighLow: false })).not.toContain("high-low");
		});
	});
});
