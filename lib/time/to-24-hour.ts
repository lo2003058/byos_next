const TWELVE_HOUR = /\b(\d{1,2}):(\d{2})[\s ]*([AaPp])\.?[Mm]\.?/g;

/** Rewrites every "h:mm AM/PM" in `text` as 24-hour "HH:mm"; other text is untouched. */
export function to24Hour(text: string): string {
	return text.replace(
		TWELVE_HOUR,
		(_match, hour: string, minutes: string, meridiem: string) => {
			const isPm = meridiem.toLowerCase() === "p";
			const hour24 = (Number(hour) % 12) + (isPm ? 12 : 0);
			return `${String(hour24).padStart(2, "0")}:${minutes}`;
		},
	);
}
