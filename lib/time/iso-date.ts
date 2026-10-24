function format(epochMs: number, timezone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(epochMs));
}

/** YYYY-MM-DD of `epochMs` in `timezone`; UTC when the timezone is invalid. */
export function isoDateIn(epochMs: number, timezone: string): string {
	try {
		return format(epochMs, timezone);
	} catch {
		return format(epochMs, "UTC");
	}
}
