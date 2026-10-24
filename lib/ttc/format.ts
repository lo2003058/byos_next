/** "8:07 AM" for `epochMs` in `timezone`; empty string if either is invalid. */
export function formatClock(epochMs: number, timezone: string): string {
	if (!Number.isFinite(epochMs)) return "";
	try {
		return new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(new Date(epochMs));
	} catch {
		return "";
	}
}
