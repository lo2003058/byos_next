import { screenCanvasPadding } from "@/components/trmnl/screen-layout";
import type { ScreenProfile } from "@/lib/trmnl/screen-profile";
import type { FooterParts } from "./format";
import { BatteryIcon, CalendarIcon } from "./icons";

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
	const iconSize = Math.round(fontSize * 1.1);
	const iconGap = Math.round(fontSize * 0.4);

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
			<div
				style={{
					...cell,
					flex: 1,
					justifyContent: "flex-start",
					alignItems: "center",
					gap: iconGap,
				}}
			>
				{parts.left ? <CalendarIcon size={iconSize} /> : null}
				<div style={{ display: "flex" }}>{parts.left}</div>
			</div>
			<div style={{ ...cell, flex: "none", maxWidth: "50%" }}>
				{parts.center}
			</div>
			<div
				style={{
					...cell,
					flex: 1,
					justifyContent: "flex-end",
					alignItems: "center",
					gap: iconGap,
				}}
			>
				{parts.right && parts.batteryLevel !== null ? (
					<BatteryIcon
						size={iconSize}
						level={parts.batteryLevel}
						charging={parts.charging}
					/>
				) : null}
				<div style={{ display: "flex" }}>{parts.right}</div>
			</div>
		</div>
	);
}
