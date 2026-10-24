export type TimezoneLocation = {
	label: string;
	latitude: number;
	longitude: number;
};

/** City centre for each timezone the app offers (see `timezones` in utils/helpers). */
const TIMEZONE_LOCATIONS: Record<string, TimezoneLocation> = {
	"Europe/London": {
		label: "London, United Kingdom",
		latitude: 51.5074,
		longitude: -0.1278,
	},
	"Europe/Paris": {
		label: "Paris, France",
		latitude: 48.8566,
		longitude: 2.3522,
	},
	"Europe/Berlin": {
		label: "Berlin, Germany",
		latitude: 52.52,
		longitude: 13.405,
	},
	"Europe/Madrid": {
		label: "Madrid, Spain",
		latitude: 40.4168,
		longitude: -3.7038,
	},
	"Europe/Rome": {
		label: "Rome, Italy",
		latitude: 41.9028,
		longitude: 12.4964,
	},
	"Europe/Amsterdam": {
		label: "Amsterdam, Netherlands",
		latitude: 52.3676,
		longitude: 4.9041,
	},
	"Europe/Athens": {
		label: "Athens, Greece",
		latitude: 37.9838,
		longitude: 23.7275,
	},
	"Europe/Moscow": {
		label: "Moscow, Russia",
		latitude: 55.7558,
		longitude: 37.6173,
	},
	"America/New_York": {
		label: "New York, United States",
		latitude: 40.7128,
		longitude: -74.006,
	},
	"America/Chicago": {
		label: "Chicago, United States",
		latitude: 41.8781,
		longitude: -87.6298,
	},
	"America/Denver": {
		label: "Denver, United States",
		latitude: 39.7392,
		longitude: -104.9903,
	},
	"America/Los_Angeles": {
		label: "Los Angeles, United States",
		latitude: 34.0522,
		longitude: -118.2437,
	},
	"America/Toronto": {
		label: "Toronto, Canada",
		latitude: 43.6532,
		longitude: -79.3832,
	},
	"America/Vancouver": {
		label: "Vancouver, Canada",
		latitude: 49.2827,
		longitude: -123.1207,
	},
	"Asia/Tokyo": {
		label: "Tokyo, Japan",
		latitude: 35.6762,
		longitude: 139.6503,
	},
	"Asia/Shanghai": {
		label: "Shanghai, China",
		latitude: 31.2304,
		longitude: 121.4737,
	},
	"Asia/Singapore": {
		label: "Singapore",
		latitude: 1.3521,
		longitude: 103.8198,
	},
	"Asia/Dubai": {
		label: "Dubai, United Arab Emirates",
		latitude: 25.2048,
		longitude: 55.2708,
	},
	"Asia/Hong_Kong": {
		label: "Hong Kong",
		latitude: 22.3193,
		longitude: 114.1694,
	},
	"Australia/Sydney": {
		label: "Sydney, Australia",
		latitude: -33.8688,
		longitude: 151.2093,
	},
	"Australia/Melbourne": {
		label: "Melbourne, Australia",
		latitude: -37.8136,
		longitude: 144.9631,
	},
	"Australia/Perth": {
		label: "Perth, Australia",
		latitude: -31.9505,
		longitude: 115.8605,
	},
	"Pacific/Auckland": {
		label: "Auckland, New Zealand",
		latitude: -36.8485,
		longitude: 174.7633,
	},
};

/** Used when a device has no usable timezone (UTC or unknown). */
export const DEFAULT_LOCATION: TimezoneLocation =
	TIMEZONE_LOCATIONS["America/Toronto"];

export function locationForTimezone(
	timezone: string | null | undefined,
): TimezoneLocation | null {
	if (!timezone) return null;
	return TIMEZONE_LOCATIONS[timezone] ?? null;
}
