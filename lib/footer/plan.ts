import type { FooterConfig } from "./config";
import { buildFooterParts, type FooterParts } from "./format";
import { footerHeight } from "./layout";

export type FooterPlan = {
	parts: FooterParts;
	footerHeight: number;
	/** Height left for the recipe above the strip. */
	contentHeight: number;
};

/** Below this the recipe would have too little room, so the footer is skipped. */
const MIN_CONTENT_HEIGHT = 120;

/** Decides whether and how to draw the footer; null means "draw nothing". */
export function planFooter(
	config: FooterConfig,
	context: {
		now: number;
		timezone: string;
		voltage: number | null;
		width: number;
		height: number;
	},
): FooterPlan | null {
	if (!config.enabled) return null;

	const parts = buildFooterParts(config, context);
	if (!parts.left && !parts.center && !parts.right) return null;

	const strip = footerHeight(context.width, context.height);
	const contentHeight = context.height - strip;
	if (contentHeight < MIN_CONTENT_HEIGHT) return null;

	return { parts, footerHeight: strip, contentHeight };
}
