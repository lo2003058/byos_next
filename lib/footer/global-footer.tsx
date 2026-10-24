import { screenCanvasPadding } from "@/components/trmnl/screen-layout";
import type { ScreenProfile } from "@/lib/trmnl/screen-profile";
import type { FooterParts } from "./format";

const BORDER = 2;

const cell = {
	display: "flex",
	overflow: "hidden",
	whiteSpace: "nowrap",
} as const;

/**
 * The bar drawn flush along the bottom of every screen: a top border only,
 * with the date on the left, fixed text in the middle and battery on the
 * right. `height` is the whole bar including its border.
 */
export function GlobalFooter({
	parts,
	width,
	height,
	screen,
}: {
	parts: FooterParts;
	width: number;
	height: number;
	screen: ScreenProfile;
}) {
	const side = screenCanvasPadding(screen);
	const fontSize = Math.max(14, Math.round(height * 0.5));

	return (
		<div
			className="font-inter"
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				width,
				height,
				boxSizing: "border-box",
				borderTop: `${BORDER}px solid #000`,
				padding: `0 ${side}px`,
				backgroundColor: "#fff",
				color: "#000",
				fontFamily: "inter",
				fontSize,
				lineHeight: 1,
				gap: Math.round(height * 0.3),
			}}
		>
			<div style={{ ...cell, flex: 1, justifyContent: "flex-start" }}>
				{parts.left}
			</div>
			<div style={{ ...cell, flex: "none", maxWidth: "50%" }}>
				{parts.center}
			</div>
			<div style={{ ...cell, flex: 1, justifyContent: "flex-end" }}>
				{parts.right}
			</div>
		</div>
	);
}
