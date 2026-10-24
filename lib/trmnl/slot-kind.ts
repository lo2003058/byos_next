export type SlotKind = "full" | "half" | "banner" | "quarter";

/** A slot at most this tall cannot fit a stacked layout. */
const SHORT_HEIGHT = 300;
/** A slot at most this wide is a half or quarter slot. */
const NARROW_WIDTH = 520;

/** Which mixup slot shape a recipe is being rendered into, from its logical size. */
export function slotKind(size: {
	logicalWidth: number;
	logicalHeight: number;
}): SlotKind {
	const narrow = size.logicalWidth <= NARROW_WIDTH;
	const short = size.logicalHeight <= SHORT_HEIGHT;
	if (narrow && short) return "quarter";
	if (short) return "banner";
	if (narrow) return "half";
	return "full";
}
