/** Adds the device `access_token` to an image URL unless it already has one. */
export function withAccessToken(url: string, apiKey: string): string {
	if (/[?&]access_token=/.test(url)) return url;
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}access_token=${encodeURIComponent(apiKey)}`;
}

const REDACTED = "%5Bredacted%5D";

/**
 * Hides the `access_token` value in an image URL so the device API key never
 * lands in logs. Works on plain text too, so it cannot throw on odd input.
 */
export function redactAccessToken(url: string): string {
	return url.replace(/(\baccess_token=)[^&#\s]*/g, `$1${REDACTED}`);
}
