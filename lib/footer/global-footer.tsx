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
 * The strip drawn under every recipe: date on the left, fixed text in the
 * middle, battery on the right. `height` is the whole strip including the gap
 * below the outlined box, so the box lines up with recipe footers above it.
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
	const bottomGap = Math.max(4, Math.round(height * 0.18));
	const boxHeight = height - bottomGap;
	const fontSize = Math.max(14, Math.round(boxHeight * 0.55));

	return (
		<div
			className="font-inter"
			style={{
				display: "flex",
				width,
				height,
				boxSizing: "border-box",
				padding: `0 ${side}px ${bottomGap}px`,
				backgroundColor: "#fff",
				color: "#000",
				fontFamily: "inter",
			}}
		>
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					boxSizing: "border-box",
					border: `${BORDER}px solid #000`,
					borderRadius: Math.round(boxHeight * 0.35),
					padding: `0 ${Math.round(boxHeight * 0.4)}px`,
					fontSize,
					lineHeight: 1,
					gap: Math.round(boxHeight * 0.3),
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
		</div>
	);
}
