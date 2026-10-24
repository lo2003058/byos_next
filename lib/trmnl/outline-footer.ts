import type { CSSProperties } from "react";

/**
 * Footer look for screens that avoid large filled black areas: white box with
 * a solid black outline. Spread into `ScreenFooter`'s `style` prop.
 */
export function outlineFooterStyle(borderWidth = 2): CSSProperties {
	return {
		backgroundColor: "#fff",
		color: "#000",
		borderStyle: "solid",
		borderColor: "#000",
		borderWidth,
	};
}
