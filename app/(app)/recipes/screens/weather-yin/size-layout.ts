export type WeatherLayoutKind = "full" | "half" | "banner" | "quarter";

export type WeatherLayout = {
	kind: WeatherLayoutKind;
	/** How many stat tiles fit. */
	maxStats: number;
};

/** A slot at most this tall cannot fit the stacked layout. */
const SHORT_HEIGHT = 300;
/** A slot at most this wide is a half or quarter slot. */
const NARROW_WIDTH = 520;

/** Picks a layout from the logical size the recipe is rendered at. */
export function weatherLayout(size: {
	logicalWidth: number;
	logicalHeight: number;
}): WeatherLayout {
	const narrow = size.logicalWidth <= NARROW_WIDTH;
	const short = size.logicalHeight <= SHORT_HEIGHT;
	if (narrow && short) return { kind: "quarter", maxStats: 4 };
	if (short) return { kind: "banner", maxStats: 8 };
	if (narrow) return { kind: "half", maxStats: 8 };
	return { kind: "full", maxStats: 8 };
}
