import {
	DEFAULT_LOCATION,
	locationForTimezone,
} from "@/lib/geo/timezone-location";

export type ResolvedWeatherLocation = {
	latitude: number;
	longitude: number;
	label: string;
};

/**
 * Where to fetch weather for: the optional coordinates when both are set,
 * otherwise the city of the device's timezone, otherwise a default city.
 */
export function resolveWeatherLocation(
	override: { latitude: number; longitude: number },
	deviceTimezone: string | null | undefined,
): ResolvedWeatherLocation {
	if (override.latitude !== 0 && override.longitude !== 0) {
		return {
			latitude: override.latitude,
			longitude: override.longitude,
			label: `${override.latitude.toFixed(2)}, ${override.longitude.toFixed(2)}`,
		};
	}
	const city = locationForTimezone(deviceTimezone) ?? DEFAULT_LOCATION;
	return {
		latitude: city.latitude,
		longitude: city.longitude,
		label: city.label,
	};
}
