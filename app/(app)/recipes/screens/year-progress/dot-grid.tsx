import { screenFontSize, screenMetric } from "@/components/trmnl/screen-layout";
import type { ScreenProfile } from "@/lib/trmnl/screen-profile";
import type { MonthRow } from "./progress";
import { Text } from "./ui";

const MAX_DAYS_IN_MONTH = 31;
const MONTHS = 12;

function Dot({
	size,
	state,
}: {
	size: number;
	state: "done" | "today" | "future";
}) {
	const ring = Math.max(1, Math.round(size * 0.14));
	return (
		<div
			data-today={state === "today" ? "true" : undefined}
			style={{
				display: "flex",
				flex: "none",
				width: size,
				height: size,
				boxSizing: "border-box",
				borderRadius: size,
				backgroundColor: state === "done" ? "#000" : "#fff",
				border:
					state === "done"
						? "none"
						: state === "today"
							? `${ring * 2}px solid #000`
							: `${ring}px solid #000`,
			}}
		/>
	);
}

/** Grid cell pitch: as large as fits both the width and the height. */
export function gridPitch(
	screen: ScreenProfile,
	width: number,
	height: number,
): number {
	const labelWidth = screenMetric(screen, 40);
	return Math.floor(
		Math.min((width - labelWidth) / MAX_DAYS_IN_MONTH, height / MONTHS),
	);
}

/** One row of dots per month, with a month label on the left. */
export function MonthGrid({
	months,
	width,
	height,
	screen,
	fill,
}: {
	months: MonthRow[];
	width: number;
	height: number;
	screen: ScreenProfile;
	/** Take the remaining height instead of the grid's own height. */
	fill?: boolean;
}) {
	const labelWidth = screenMetric(screen, 40);
	const gap = Math.max(2, screenMetric(screen, 3));
	const columnPitch = Math.floor((width - labelWidth) / MAX_DAYS_IN_MONTH);
	// When filling, rows spread over the whole height; dots stay round.
	const rowPitch = fill
		? Math.min(Math.floor(height / MONTHS), Math.floor(columnPitch * 1.7))
		: gridPitch(screen, width, height);
	const pitch = fill ? columnPitch : gridPitch(screen, width, height);
	const dot = Math.max(4, Math.min(pitch, rowPitch) - gap);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "center",
				flex: fill ? 1 : "none",
				width,
			}}
		>
			{months.map((month) => (
				<div
					key={month.label}
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						height: rowPitch,
					}}
				>
					<Text
						size={Math.max(
							10,
							Math.min(screenFontSize(screen, 16, 10), rowPitch),
						)}
						style={{ width: labelWidth, flex: "none" }}
					>
						{month.label}
					</Text>
					<div style={{ display: "flex", flexDirection: "row", gap }}>
						{Array.from({ length: month.days }, (_, index) => {
							const day = index + 1;
							const state =
								month.todayDay === day
									? "today"
									: day <= month.doneDays
										? "done"
										: "future";
							return <Dot key={day} size={dot} state={state} />;
						})}
					</div>
				</div>
			))}
		</div>
	);
}

export function ProgressBar({
	width,
	height,
	percent,
	screen,
}: {
	width: number;
	height?: number;
	percent: number;
	screen: ScreenProfile;
}) {
	const border = Math.max(2, screenMetric(screen, 3));
	const fill = Math.round((width - border * 2) * (percent / 100));
	return (
		<div
			data-testid="progress-bar"
			style={{
				display: "flex",
				flexDirection: "row",
				width,
				height: height ?? screenMetric(screen, 30),
				boxSizing: "border-box",
				border: `${border}px solid #000`,
				borderRadius: screenMetric(screen, 8),
				overflow: "hidden",
				backgroundColor: "#fff",
			}}
		>
			<div style={{ display: "flex", width: fill, backgroundColor: "#000" }} />
		</div>
	);
}
