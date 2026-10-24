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
import { gridPitch, MonthGrid, ProgressBar } from "./dot-grid";
import { getPublicHolidays } from "./get-holidays";
import { HolidayCards, HolidayPanel } from "./holiday-parts";
import {
	DEFAULT_PROVINCE,
	normalizeProvince,
	PROVINCE_NAMES,
} from "./holidays";
import { yearMonthGrid, yearProgress } from "./progress";
import { Text } from "./ui";

const DEFAULT_TIMEZONE = "America/Toronto";
const MONTHS = 12;

export const paramsSchema = z.object({
	showHolidays: z
		.boolean()
		.default(true)
		.describe("List the next public holidays next to the year progress")
		.meta({ title: "Show public holidays" }),
	province: z
		.string()
		.default(DEFAULT_PROVINCE)
		.describe(
			`Province or territory code for the holidays: ${Object.keys(PROVINCE_NAMES).join(", ")}`,
		)
		.meta({ title: "Province code", placeholder: DEFAULT_PROVINCE }),
});

const holidaySchema = z.object({
	date: z.string(),
	name: z.string(),
	weekday: z.string(),
	daysUntil: z.number(),
	longWeekend: z.boolean(),
});

export const dataSchema = z.object({
	year: z.number().default(new Date().getUTCFullYear()),
	dayOfYear: z.number().default(1),
	daysInYear: z.number().default(365),
	daysLeft: z.number().default(364),
	percent: z.number().default(0),
	jan1Weekday: z.number().default(0),
	showHolidays: z.boolean().default(true),
	province: z.string().default(DEFAULT_PROVINCE),
	provinceName: z.string().default(PROVINCE_NAMES[DEFAULT_PROVINCE]),
	holidays: z.array(holidaySchema).default([]),
	holidayError: z.string().default(""),
});

type YearProgressData = z.infer<typeof dataSchema>;

type Props = Partial<YearProgressData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

export default function YearProgress({
	year = new Date().getUTCFullYear(),
	dayOfYear = 1,
	daysInYear = 365,
	daysLeft = 364,
	percent = 0,
	jan1Weekday = 0,
	showHolidays = true,
	provinceName = PROVINCE_NAMES[DEFAULT_PROVINCE],
	holidays = [],
	holidayError = "",
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Props) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(screenProfile);
	const metric = (value: number) => screenMetric(screenProfile, value);
	const font = (value: number, min = 12) =>
		screenFontSize(screenProfile, value, min);
	const padding = screenCanvasPadding(screenProfile);
	const innerWidth = screenProfile.logicalWidth - padding * 2;
	const innerHeight = screenProfile.logicalHeight - padding * 2;
	const gap = metric(14);

	const months = yearMonthGrid({
		year,
		dayOfYear,
		daysInYear,
		daysLeft,
		percent,
		jan1Weekday,
	});

	const percentBlock = (size: number) => (
		<Text size={metric(size)} bold style={{ lineHeight: 1 }}>
			{`${percent}%`}
		</Text>
	);
	const detailLines = (size: number, align: "flex-start" | "flex-end") => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: align,
				gap: metric(2),
			}}
		>
			<Text size={font(size)} bold>
				{String(year)}
			</Text>
			<Text size={font(size)}>{`Day ${dayOfYear} of ${daysInYear}`}</Text>
			<Text size={font(size)}>{`${daysLeft} days left`}</Text>
		</div>
	);
	const headerRow = (percentSize: number, detailSize: number, w: number) => (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "flex-end",
				justifyContent: "space-between",
				width: w,
			}}
		>
			{percentBlock(percentSize)}
			{detailLines(detailSize, "flex-end")}
		</div>
	);
	const holidayProps = { holidays, error: holidayError, screen: screenProfile };

	let body: React.ReactNode;
	if (kind === "full" && showHolidays) {
		const leftWidth = Math.round(innerWidth * 0.53);
		const rightWidth = innerWidth - leftWidth - gap;
		const headerHeight = metric(104);
		body = (
			<div style={{ display: "flex", flex: 1, flexDirection: "row", gap }}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: leftWidth,
						gap: metric(6),
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							height: headerHeight,
							justifyContent: "flex-end",
							gap: metric(4),
						}}
					>
						{percentBlock(70)}
						<Text size={font(20)}>
							{`${year} · Day ${dayOfYear} of ${daysInYear} · ${daysLeft} days left`}
						</Text>
					</div>
					<MonthGrid
						months={months}
						width={leftWidth}
						height={innerHeight - headerHeight - metric(6)}
						screen={screenProfile}
						fill
					/>
				</div>
				<HolidayPanel
					{...holidayProps}
					provinceName={provinceName}
					rows={5}
					width={rightWidth}
					big
				/>
			</div>
		);
	} else if (kind === "half" && showHolidays) {
		const headerHeight = metric(60);
		const gridHeight =
			gridPitch(screenProfile, innerWidth, innerHeight) * MONTHS;
		body = (
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					gap: metric(8),
				}}
			>
				<div
					style={{
						display: "flex",
						height: headerHeight,
						alignItems: "flex-end",
					}}
				>
					{headerRow(50, 14, innerWidth)}
				</div>
				<MonthGrid
					months={months}
					width={innerWidth}
					height={gridHeight}
					screen={screenProfile}
				/>
				<HolidayPanel
					{...holidayProps}
					provinceName={provinceName}
					rows={3}
					width={innerWidth}
				/>
			</div>
		);
	} else if (kind === "banner" && showHolidays) {
		const leftWidth = Math.round(innerWidth * 0.33);
		body = (
			<div style={{ display: "flex", flex: 1, flexDirection: "row", gap }}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: leftWidth,
					}}
				>
					{percentBlock(64)}
					<div style={{ display: "flex", flexDirection: "column" }}>
						<Text size={font(18)}>{`Day ${dayOfYear} of ${daysInYear}`}</Text>
						<Text size={font(18)}>{`${daysLeft} days left`}</Text>
					</div>
					<ProgressBar
						width={leftWidth}
						height={metric(22)}
						percent={percent}
						screen={screenProfile}
					/>
				</div>
				<HolidayCards {...holidayProps} count={3} />
			</div>
		);
	} else if (kind === "quarter" && showHolidays) {
		body = (
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					gap: metric(6),
				}}
			>
				{headerRow(40, 12, innerWidth)}
				<ProgressBar
					width={innerWidth}
					height={metric(18)}
					percent={percent}
					screen={screenProfile}
				/>
				<HolidayPanel
					{...holidayProps}
					provinceName={provinceName}
					rows={2}
					width={innerWidth}
					showTitle={false}
				/>
			</div>
		);
	} else if (kind === "full" || kind === "half") {
		const percentSize = kind === "full" ? 92 : 64;
		const headerHeight = Math.round(metric(percentSize) * 1.15);
		body = (
			<>
				{headerRow(percentSize, kind === "full" ? 26 : 20, innerWidth)}
				<MonthGrid
					months={months}
					width={innerWidth}
					height={innerHeight - headerHeight - metric(8)}
					screen={screenProfile}
					fill
				/>
			</>
		);
	} else {
		body = (
			<>
				{headerRow(
					kind === "banner" ? 84 : 60,
					kind === "banner" ? 26 : 20,
					innerWidth,
				)}
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
			</>
		);
	}

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<ScreenCanvas screen={screenProfile}>{body}</ScreenCanvas>
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
			"How much of the year has passed, as a percentage and a dot per day (one row per month), with the next public holidays for a Canadian province beside it. Today's date uses the device's timezone.",
		published: true,
		tags: ["time", "year", "progress", "holidays", "canada", "fork"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-10-24T00:00:00Z",
		updatedAt: "2026-10-24T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params, context) => {
		const progress = yearProgress(
			Date.now(),
			context?.deviceTimezone ?? DEFAULT_TIMEZONE,
		);
		if (!params.showHolidays) {
			const province = normalizeProvince(params.province);
			return {
				...progress,
				showHolidays: false,
				province,
				provinceName: PROVINCE_NAMES[province],
				holidays: [],
				holidayError: "",
			};
		}
		const holidays = await getPublicHolidays(params, context);
		return {
			...progress,
			showHolidays: true,
			province: holidays.province,
			provinceName: holidays.provinceName,
			holidays: holidays.holidays,
			holidayError: holidays.error,
		};
	},
	Component: ({ width, height, screen, data }) => (
		<YearProgress {...data} width={width} height={height} screen={screen} />
	),
};
