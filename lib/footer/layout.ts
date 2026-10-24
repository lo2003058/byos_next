const BASE_FOOTER_HEIGHT = 34;
const MIN_FOOTER_HEIGHT = 26;

/** Same scale rule as `screenScale` in screen-layout, kept free of React imports. */
function scaleFor(width: number, height: number): number {
	return Math.max(0.75, Math.min(width / 800, height / 480));
}

/** Height in px of the global footer strip for a device of this size. */
export function footerHeight(width: number, height: number): number {
	return Math.max(
		MIN_FOOTER_HEIGHT,
		Math.round(BASE_FOOTER_HEIGHT * scaleFor(width, height)),
	);
}
