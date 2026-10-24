/** Adds the device `access_token` to an image URL unless it already has one. */
export function withAccessToken(url: string, apiKey: string): string {
	if (/[?&]access_token=/.test(url)) return url;
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}access_token=${encodeURIComponent(apiKey)}`;
}
