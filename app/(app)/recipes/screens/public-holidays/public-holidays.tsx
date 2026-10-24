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
import { type SlotKind, slotKind } from "@/lib/trmnl/slot-kind";
import { PreSatori } from "@/utils/pre-satori";
import { getPublicHolidays } from "./get-holidays";
import {
	DEFAULT_PROVINCE,
	daysUntilLabel,
	PROVINCE_NAMES,
	shortDate,
} from "./holidays";

const BOLD = "interBold, inter, sans-serif";

export const paramsSchema = z.object({
	province: z
		.string()
		.default(DEFAULT_PROVINCE)
		.describe(
			`Province or territory code: ${Object.keys(PROVINCE_NAMES).join(", ")}`,
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
	province: z.string().default(DEFAULT_PROVINCE),
	provinceName: z.string().default(PROVINCE_NAMES[DEFAULT_PROVINCE]),
	today: z.string().default(""),
	holidays: z.array(holidaySchema).default([]),
	error: z.string().default(""),
});

type HolidayData = z.infer<typeof dataSchema>;
type Holiday = HolidayData["holidays"][number];

type Props = Partial<HolidayData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

const MAX_ROWS: Record<SlotKind, number> = {
	full: 7,
	half: 6,
	banner: 3,
	quarter: 3,
};

function Text({
	children,
	size,
	bold,
	style,
}: {
	children: React.ReactNode;
	size: number;
	bold?: boolean;
	style?: React.CSSProperties;
}) {
	return (
		<div
			className={bold ? "font-interBold" : "font-inter"}
			style={{
				display: "flex",
				fontSize: size,
				lineHeight: 1.1,
				whiteSpace: "nowrap",
				overflow: "hidden",
				...style,
				// After `style`: PreSatori injects its default pixel font into it.
				fontFamily: bold ? BOLD : "inter",
			}}
		>
			{children}
		</div>
	);
}

function LongWeekend({
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

function Row({
	holiday,
	screen,
	kind,
}: {
	holiday: Holiday;
	screen: ScreenProfile;
	kind: SlotKind;
}) {
	const small = kind === "half" || kind === "quarter";
	const nameSize = screenFontSize(screen, small ? 22 : 28, 14);
	const metaSize = screenFontSize(screen, small ? 16 : 22, 12);
	const date = `${holiday.weekday}, ${shortDate(holiday.date)}`;

	return (
		<div
			data-holiday={holiday.date}
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "row",
				alignItems: "center",
				gap: screenMetric(screen, 12),
				borderBottom: `${Math.max(1, screenMetric(screen, 2))}px solid #000`,
				overflow: "hidden",
			}}
		>
			{small ? (
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						overflow: "hidden",
						gap: screenMetric(screen, 2),
					}}
				>
					<Text size={nameSize} bold>
						{holiday.name}
					</Text>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: screenMetric(screen, 8),
						}}
					>
						<Text size={metaSize}>{date}</Text>
						{holiday.longWeekend && kind === "half" ? (
							<LongWeekend screen={screen} size={metaSize} />
						) : null}
					</div>
				</div>
			) : (
				<>
					<Text
						size={nameSize}
						bold
						style={{ width: screenMetric(screen, 180), flex: "none" }}
					>
						{date}
					</Text>
					<Text size={nameSize} style={{ flex: 1 }}>
						{holiday.name}
					</Text>
					{holiday.longWeekend ? (
						<LongWeekend screen={screen} size={metaSize} />
					) : null}
				</>
			)}
			<Text
				size={small ? metaSize + 2 : nameSize}
				bold
				style={{
					flex: "none",
					justifyContent: "flex-end",
					width: screenMetric(screen, small ? 120 : 190),
				}}
			>
				{daysUntilLabel(holiday.daysUntil)}
			</Text>
		</div>
	);
}

function Card({
	holiday,
	screen,
}: {
	holiday: Holiday;
	screen: ScreenProfile;
}) {
	return (
		<div
			data-holiday={holiday.date}
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "column",
				justifyContent: "space-between",
				overflow: "hidden",
				border: `${Math.max(2, screenMetric(screen, 3))}px solid #000`,
				borderRadius: screenMetric(screen, 10),
				padding: screenMetric(screen, 10),
			}}
		>
			<Text size={screenFontSize(screen, 24, 14)} bold>
				{holiday.name}
			</Text>
			<Text size={screenFontSize(screen, 20, 14)}>
				{`${holiday.weekday}, ${shortDate(holiday.date)}`}
			</Text>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Text size={screenFontSize(screen, 22, 14)} bold>
					{daysUntilLabel(holiday.daysUntil)}
				</Text>
				{holiday.longWeekend ? (
					<LongWeekend screen={screen} size={screenFontSize(screen, 14, 11)} />
				) : null}
			</div>
		</div>
	);
}

export default function PublicHolidays({
	provinceName = PROVINCE_NAMES[DEFAULT_PROVINCE],
	holidays = [],
	error = "",
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Props) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(screenProfile);
	const shown = holidays.slice(0, MAX_ROWS[kind]);
	const padding = screenCanvasPadding(screenProfile);
	const titleSize = screenFontSize(
		screenProfile,
		{ full: 32, half: 24, banner: 26, quarter: 20 }[kind],
		14,
	);

	const message = error || (shown.length === 0 ? "No upcoming holidays" : "");

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<ScreenCanvas screen={screenProfile}>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						width: screenProfile.logicalWidth - padding * 2,
					}}
				>
					<Text size={titleSize} bold>
						Public holidays
					</Text>
					<Text size={Math.round(titleSize * 0.75)}>{provinceName}</Text>
				</div>
				{message ? (
					<div
						style={{
							display: "flex",
							flex: 1,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text size={screenFontSize(screenProfile, 28, 16)} bold>
							{message}
						</Text>
					</div>
				) : kind === "banner" ? (
					<div
						style={{
							display: "flex",
							flex: 1,
							flexDirection: "row",
							gap: screenMetric(screenProfile, 10),
						}}
					>
						{shown.map((holiday) => (
							<Card
								key={holiday.date + holiday.name}
								holiday={holiday}
								screen={screenProfile}
							/>
						))}
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flex: 1,
							flexDirection: "column",
						}}
					>
						{shown.map((holiday) => (
							<Row
								key={holiday.date + holiday.name}
								holiday={holiday}
								screen={screenProfile}
								kind={kind}
							/>
						))}
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
		slug: "public-holidays",
		title: "Public Holidays",
		description:
			"The next public holidays for a Canadian province or territory, with days to go and long-weekend marks. Data from Nager.Date; today's date uses the device's timezone.",
		published: true,
		tags: ["holidays", "canada", "api", "live-data", "configurable", "fork"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.1.0",
		createdAt: "2026-10-24T00:00:00Z",
		updatedAt: "2026-10-24T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params, context) => getPublicHolidays(params, context),
	Component: ({ width, height, screen, data }) => (
		<PublicHolidays {...data} width={width} height={height} screen={screen} />
	),
};
