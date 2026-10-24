import { createElement } from "react";
import { renderWithTakumi } from "@/lib/recipes/renderers/takumi";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import type { FooterParts } from "./format";
import { GlobalFooter } from "./global-footer";

/** Draw the footer strip as a PNG of exactly `width` x `height`. */
export async function renderFooterPng(
	parts: FooterParts,
	{
		width,
		height,
		deviceHeight,
	}: { width: number; height: number; deviceHeight: number },
): Promise<Buffer> {
	const screen = createScreenProfile({ width, height: deviceHeight });
	return renderWithTakumi(
		createElement(GlobalFooter, { parts, width, height, screen }),
		width,
		height,
	);
}
