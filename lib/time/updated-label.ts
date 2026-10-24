const CLOCK = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

/** "Oct 24, 15:30" -> "Updated 15:30"; empty when there is no clock time. */
export function updatedLabel(text: string): string {
	const match = text.match(CLOCK);
	if (!match) return "";
	return `Updated ${match[1].padStart(2, "0")}:${match[2]}`;
}
