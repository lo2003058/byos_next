/** "08:07" (24-hour) for `epochMs` in `timezone`; empty string if either is invalid. */
export function formatClock(epochMs: number, timezone: string): string {
	if (!Number.isFinite(epochMs)) return "";
	try {
		return new Intl.DateTimeFormat("en-GB", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).format(new Date(epochMs));
	} catch {
		return "";
	}
}
