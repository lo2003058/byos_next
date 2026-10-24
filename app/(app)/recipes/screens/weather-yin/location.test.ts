/// <reference types="jest" />
import { DEFAULT_LOCATION } from "@/lib/geo/timezone-location";
import { resolveWeatherLocation } from "./location";

describe("resolveWeatherLocation", () => {
	it("uses the explicit coordinates when both are set", () => {
		expect(
			resolveWeatherLocation(
				{ latitude: 43.7615, longitude: -79.4111 },
				"America/Toronto",
			),
		).toEqual({
			latitude: 43.7615,
			longitude: -79.4111,
			label: "43.76, -79.41",
		});
	});

	it("uses the device timezone's city when no coordinates are set", () => {
		expect(
			resolveWeatherLocation({ latitude: 0, longitude: 0 }, "Asia/Tokyo"),
		).toEqual({
			latitude: 35.6762,
			longitude: 139.6503,
			label: "Tokyo, Japan",
		});
	});

	it("ignores a half-filled override and falls back to the timezone city", () => {
		expect(
			resolveWeatherLocation({ latitude: 43.7, longitude: 0 }, "Asia/Tokyo")
				.label,
		).toBe("Tokyo, Japan");
	});

	it("falls back to the default city for UTC, unknown or missing timezones", () => {
		const expected = {
			latitude: DEFAULT_LOCATION.latitude,
			longitude: DEFAULT_LOCATION.longitude,
			label: DEFAULT_LOCATION.label,
		};
		expect(
			resolveWeatherLocation({ latitude: 0, longitude: 0 }, "UTC"),
		).toEqual(expected);
		expect(
			resolveWeatherLocation({ latitude: 0, longitude: 0 }, "X/Y"),
		).toEqual(expected);
		expect(
			resolveWeatherLocation({ latitude: 0, longitude: 0 }, undefined),
		).toEqual(expected);
	});
});
