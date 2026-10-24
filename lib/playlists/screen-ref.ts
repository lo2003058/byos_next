/**
 * Playlist items keep one `screen_id` string. A plain value is a recipe slug;
 * `mixup/<id>` points at a mixup, which doubles as its bitmap image path.
 */
export type ScreenRef =
	| { kind: "recipe"; slug: string }
	| { kind: "mixup"; id: string };

const MIXUP_PREFIX = "mixup/";

export function mixupScreenId(mixupId: string): string {
	return `${MIXUP_PREFIX}${mixupId}`;
}

export function parseScreenRef(screenId: string): ScreenRef {
	if (screenId.startsWith(MIXUP_PREFIX)) {
		const id = screenId.slice(MIXUP_PREFIX.length);
		if (id && !id.includes("/")) return { kind: "mixup", id };
	}
	return { kind: "recipe", slug: screenId };
}

/**
 * Image path and query for a playlist item. Mixup images carry the device's
 * access token because the mixup route authorises device fetches with it.
 */
export function playlistImageTarget(
	screenId: string,
	apiKey: string,
	baseQuery: string,
): { imagePath: string; query: string } {
	const ref = parseScreenRef(screenId);
	if (ref.kind === "mixup") {
		return {
			imagePath: mixupScreenId(ref.id),
			query: `${baseQuery}&access_token=${encodeURIComponent(apiKey)}`,
		};
	}
	return { imagePath: ref.slug, query: baseQuery };
}
