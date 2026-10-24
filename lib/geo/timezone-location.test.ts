/// <reference types="jest" />
import { timezones } from "@/utils/helpers";
import { DEFAULT_LOCATION, locationForTimezone } from "./timezone-location";

describe("locationForTimezone", () => {
	it("maps a timezone to its city", () => {
		expect(locationForTimezone("America/Toronto")).toEqual({
			label: "Toronto, Canada",
			latitude: 43.6532,
			longitude: -79.3832,
		});
	});

	it("covers every timezone the app offers, except UTC", () => {
		for (const tz of timezones) {
			if (tz.value === "UTC") continue;
			expect({ tz: tz.value, found: locationForTimezone(tz.value) }).toEqual({
				tz: tz.value,
				found: expect.objectContaining({ label: expect.any(String) }),
			});
		}
	});

	it("keeps every coordinate in range", () => {
		for (const tz of timezones) {
			const found = locationForTimezone(tz.value);
			if (!found) continue;
			expect(Math.abs(found.latitude)).toBeLessThanOrEqual(90);
			expect(Math.abs(found.longitude)).toBeLessThanOrEqual(180);
		}
	});

	it("returns null for an unknown, UTC or missing timezone", () => {
		expect(locationForTimezone("Nowhere/City")).toBeNull();
		expect(locationForTimezone("UTC")).toBeNull();
		expect(locationForTimezone(null)).toBeNull();
		expect(locationForTimezone(undefined)).toBeNull();
	});

	it("has a default that is itself a known city", () => {
		expect(DEFAULT_LOCATION).toEqual(locationForTimezone("America/Toronto"));
	});
});
