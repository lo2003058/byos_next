import type { CSSProperties, ReactNode } from "react";
import { screenMetric } from "@/components/trmnl/screen-layout";
import type { ScreenProfile } from "@/lib/trmnl/screen-profile";

const BOLD = "interBold, inter, sans-serif";

/**
 * One line of text in Inter. PreSatori injects a default pixel font into
 * `style`, so the font family is set after the spread.
 */
export function Text({
	children,
	size,
	bold,
	family,
	style,
}: {
	children: ReactNode;
	size: number;
	bold?: boolean;
	/** A loaded font to use instead of Inter, such as `notoEmoji`. */
	family?: string;
	style?: CSSProperties;
}) {
	return (
		<div
			className={family ? undefined : bold ? "font-interBold" : "font-inter"}
			style={{
				display: "flex",
				fontSize: size,
				lineHeight: 1.1,
				whiteSpace: "nowrap",
				overflow: "hidden",
				...style,
				fontFamily: family ?? (bold ? BOLD : "inter"),
			}}
		>
			{children}
		</div>
	);
}

/** Outlined "Long weekend" tag. */
export function LongWeekend({
	screen,
	size,
}: {
	screen: ScreenProfile;
	size: number;
}) {
	return (
		<div
			style={{
				display: "flex",
				flex: "none",
				border: `${Math.max(1, screenMetric(screen, 2))}px solid #000`,
				borderRadius: screenMetric(screen, 6),
				padding: `0 ${screenMetric(screen, 6)}px`,
			}}
		>
			<Text size={size}>Long weekend</Text>
		</div>
	);
}
