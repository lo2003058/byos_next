import { z } from "zod";
import {
	ScreenCanvas,
	screenCanvasPadding,
	screenFontSize,
	screenMetric,
} from "@/components/trmnl/screen-layout";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import type { RecipeDefinition } from "@/lib/recipes/types";
import {
	createScreenProfile,
	type ScreenProfile,
} from "@/lib/trmnl/screen-profile";
import { slotKind } from "@/lib/trmnl/slot-kind";
import { PreSatori } from "@/utils/pre-satori";
import { type MonthRow, yearMonthGrid, yearProgress } from "./progress";

const DEFAULT_TIMEZONE = "America/Toronto";
const BOLD = "interBold, inter, sans-serif";
const MAX_DAYS_IN_MONTH = 31;

export const paramsSchema = z.object({});

export const dataSchema = z.object({
	year: z.number().default(new Date().getUTCFullYear()),
	dayOfYear: z.number().default(1),
	daysInYear: z.number().default(365),
	daysLeft: z.number().default(364),
	percent: z.number().default(0),
	jan1Weekday: z.number().default(0),
});

type YearProgressData = z.infer<typeof dataSchema>;

type Props = Partial<YearProgressData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

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

function MonthGrid({
	months,
	width,
	height,
	screen,
}: {
	months: MonthRow[];
	width: number;
	height: number;
	screen: ScreenProfile;
}) {
	const labelWidth = screenMetric(screen, 40);
	const gap = Math.max(2, screenMetric(screen, 3));
	const pitch = Math.floor(
		Math.min((width - labelWidth) / MAX_DAYS_IN_MONTH, height / months.length),
	);
	const dot = Math.max(4, pitch - gap);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "center",
				flex: 1,
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
						height: pitch,
					}}
				>
					<div
						className="font-inter"
						style={{
							display: "flex",
							width: labelWidth,
							fontFamily: "inter",
							fontSize: Math.max(
								10,
								Math.min(screenFontSize(screen, 16, 10), pitch),
							),
						}}
					>
						{month.label}
					</div>
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

function ProgressBar({
	width,
	percent,
	screen,
}: {
	width: number;
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
				height: screenMetric(screen, 30),
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

export default function YearProgress({
	year = new Date().getUTCFullYear(),
	dayOfYear = 1,
	daysInYear = 365,
	daysLeft = 364,
	percent = 0,
	jan1Weekday = 0,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Props) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(screenProfile);
	const padding = screenCanvasPadding(screenProfile);
	const innerWidth = screenProfile.logicalWidth - padding * 2;
	const innerHeight = screenProfile.logicalHeight - padding * 2;
	const tall = kind === "full" || kind === "half";
	const percentSize = screenMetric(
		screenProfile,
		{ full: 92, half: 64, banner: 84, quarter: 60 }[kind],
	);
	const detailSize = screenFontSize(
		screenProfile,
		{ full: 26, half: 20, banner: 26, quarter: 20 }[kind],
		14,
	);

	const header = (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "flex-end",
				justifyContent: "space-between",
				width: innerWidth,
			}}
		>
			<div
				className="font-interBold"
				style={{
					display: "flex",
					fontFamily: BOLD,
					fontSize: percentSize,
					lineHeight: 1,
				}}
			>
				{`${percent}%`}
			</div>
			<div
				className="font-inter"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					fontFamily: "inter",
					fontSize: detailSize,
					lineHeight: 1.2,
				}}
			>
				<div
					className="font-interBold"
					style={{ display: "flex", fontFamily: BOLD }}
				>
					{year}
				</div>
				<div className="font-inter" style={{ display: "flex" }}>
					{`Day ${dayOfYear} of ${daysInYear}`}
				</div>
				<div className="font-inter" style={{ display: "flex" }}>
					{`${daysLeft} days left`}
				</div>
			</div>
		</div>
	);

	const months = yearMonthGrid({
		year,
		dayOfYear,
		daysInYear,
		daysLeft,
		percent,
		jan1Weekday,
	});
	const headerHeight = Math.round(percentSize * 1.15);
	const gridHeight =
		innerHeight - headerHeight - screenMetric(screenProfile, 8);

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<ScreenCanvas screen={screenProfile}>
				{header}
				{tall ? (
					<MonthGrid
						months={months}
						width={innerWidth}
						height={gridHeight}
						screen={screenProfile}
					/>
				) : (
					<div
						style={{
							display: "flex",
							flex: 1,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<ProgressBar
							width={innerWidth}
							percent={percent}
							screen={screenProfile}
						/>
					</div>
				)}
			</ScreenCanvas>
		</PreSatori>
	);
}

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "year-progress",
		title: "Year in Progress",
		description:
			"How much of the year has passed, as a percentage and a dot per day (one row per month). Uses the device's timezone for today's date.",
		published: true,
		tags: ["time", "year", "progress", "fork"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.1.0",
		createdAt: "2026-10-24T00:00:00Z",
		updatedAt: "2026-10-24T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (_params, context) =>
		yearProgress(Date.now(), context?.deviceTimezone ?? DEFAULT_TIMEZONE),
	Component: ({ width, height, screen, data }) => (
		<YearProgress {...data} width={width} height={height} screen={screen} />
	),
};
