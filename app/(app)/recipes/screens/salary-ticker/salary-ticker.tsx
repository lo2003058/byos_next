import { z } from "zod";
import {
	ScreenCanvas,
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
import { Dot } from "../year-progress/dot-grid";
import { Text } from "../year-progress/ui";
import {
	DEFAULT_PROVINCE,
	PROVINCE_OPTIONS,
	type ProvinceCode,
	takeHomeShare,
} from "./canada-tax";
import { formatMoney } from "./format";
import {
	CURRENCY_OPTIONS,
	currencySymbol,
	PAY_TYPE_OPTIONS,
	TIME_OPTIONS,
} from "./options";
import {
	annualGross,
	earnings,
	type PayConfig,
	parsePayType,
	parseTime,
	parseWorkDays,
	workdayProgress,
	yearIn,
} from "./pay";

const DEFAULT_TIMEZONE = "America/Toronto";
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 18 * 60;
/** One dot for every half hour of the working day. */
const DOT_MINUTES = 30;

export const paramsSchema = z.object({
	payType: z
		.string()
		.default("monthly")
		.describe("How your pay is quoted")
		.meta({
			title: "Pay type",
			input: { kind: "select", options: PAY_TYPE_OPTIONS },
		}),
	amount: z
		.number()
		.default(5000)
		.describe("Your pay before tax, per year, month, day or hour")
		.meta({ title: "Pay before tax" }),
	province: z
		.string()
		.default(DEFAULT_PROVINCE)
		.describe("Where you work, for the income tax, CPP/QPP and EI")
		.meta({
			title: "Province",
			input: { kind: "select", options: PROVINCE_OPTIONS },
		}),
	currency: z
		.string()
		.default("CAD")
		.describe("Currency shown before each amount")
		.meta({
			title: "Currency",
			input: { kind: "select", options: CURRENCY_OPTIONS },
		}),
	workDays: z
		.string()
		.default("Mon,Tue,Wed,Thu,Fri")
		.describe("Days you work")
		.meta({ title: "Work days", input: { kind: "weekdays" } }),
	startTime: z
		.string()
		.default("09:00")
		.describe("When your workday starts")
		.meta({
			title: "Start time",
			input: { kind: "select", options: TIME_OPTIONS },
		}),
	endTime: z
		.string()
		.default("18:00")
		.describe("When your workday ends")
		.meta({
			title: "End time",
			input: { kind: "select", options: TIME_OPTIONS },
		}),
	breakMinutes: z
		.number()
		.default(60)
		.describe("Unpaid break inside the workday, in minutes")
		.meta({ title: "Unpaid break (min)" }),
});

const amountsSchema = z.object({
	gross: z.number().default(0),
	net: z.number().default(0),
});

export const dataSchema = z.object({
	currency: z.string().default("$"),
	provinceName: z.string().default(""),
	/** Share of gross pay kept after tax, CPP and EI. */
	takeHomePercent: z.number().default(100),
	payType: z.string().default("monthly"),
	today: amountsSchema.default({ gross: 0, net: 0 }),
	week: amountsSchema.default({ gross: 0, net: 0 }),
	month: amountsSchema.default({ gross: 0, net: 0 }),
	updatedAt: z.string().default(""),
	startTime: z.string().default("09:00"),
	endTime: z.string().default("18:00"),
	dayState: z.enum(["off", "before", "working", "done"]).default("off"),
	dayPercent: z.number().default(0),
	minutesLeft: z.number().default(0),
});

type SalaryData = z.infer<typeof dataSchema>;

type Props = Partial<SalaryData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

const NO_AMOUNTS = { gross: 0, net: 0 };

/** "3h 20m" for a number of minutes. */
export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}m`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function dayLine(
	state: SalaryData["dayState"],
	percent: number,
	minutesLeft: number,
	startTime: string,
	endTime: string,
): string {
	switch (state) {
		case "off":
			return "Day off";
		case "before":
			return `Starts ${startTime} · off at ${endTime}`;
		case "done":
			return `Done for today · off at ${endTime}`;
		default:
			return `${percent}% · off at ${endTime} · ${formatDuration(minutesLeft)} left`;
	}
}

/** One dot per half hour of the workday: done, the one under way, then to come. */
function WorkdayDots({
	count,
	percent,
	state,
	width,
}: {
	count: number;
	percent: number;
	state: SalaryData["dayState"];
	width: number;
}) {
	const gap = Math.max(3, Math.round(width / count / 8));
	const size = Math.max(6, Math.floor((width - gap * (count - 1)) / count));
	const finished =
		state === "done" ? count : Math.floor((percent / 100) * count);
	return (
		<div style={{ display: "flex", flexDirection: "row", gap }}>
			{Array.from({ length: count }, (_, index) => (
				<Dot
					key={index}
					size={size}
					state={
						index < finished
							? "done"
							: index === finished && state === "working"
								? "today"
								: "future"
					}
				/>
			))}
		</div>
	);
}

export default function SalaryTicker({
	currency = "$",
	provinceName = "",
	takeHomePercent = 100,
	payType = "monthly",
	today = NO_AMOUNTS,
	week = NO_AMOUNTS,
	month = NO_AMOUNTS,
	updatedAt = "",
	startTime = "09:00",
	endTime = "18:00",
	dayState = "off",
	dayPercent = 0,
	minutesLeft = 0,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Props) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(screenProfile);
	const metric = (value: number) => screenMetric(screenProfile, value);
	const font = (value: number, min = 14) =>
		screenFontSize(screenProfile, value, min);
	const padding = metric(kind === "full" ? 28 : 18);
	const innerWidth = screenProfile.logicalWidth - padding * 2;
	const compact = kind === "quarter" || kind === "banner";
	const money = (value: number) => formatMoney(value, currency);
	const dotCount = Math.min(
		24,
		Math.max(
			1,
			Math.ceil(
				(parseTime(endTime, DEFAULT_END) -
					parseTime(startTime, DEFAULT_START)) /
					DOT_MINUTES,
			),
		),
	);
	const status = dayLine(dayState, dayPercent, minutesLeft, startTime, endTime);
	const dots = (
		<WorkdayDots
			count={dotCount}
			percent={dayPercent}
			state={dayState}
			width={innerWidth}
		/>
	);

	const columnHeaders = (
		<div style={{ display: "flex", flexDirection: "row" }}>
			<div style={{ display: "flex", flex: 1 }} />
			<Text size={font(18)} style={{ flex: 1 }}>
				Before tax
			</Text>
			<Text size={font(18)} style={{ flex: 1 }}>
				{`After tax (${takeHomePercent}%)`}
			</Text>
		</div>
	);

	const row = (
		label: string,
		amounts: { gross: number; net: number },
		valueSize: number,
	) => (
		<div
			key={label}
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				borderTop: "2px solid #000",
				paddingTop: metric(6),
				paddingBottom: metric(6),
			}}
		>
			<Text size={font(valueSize * 0.5, 18)} bold style={{ flex: 1 }}>
				{label}
			</Text>
			<Text size={font(valueSize)} bold style={{ flex: 1 }}>
				{money(amounts.gross)}
			</Text>
			<Text size={font(valueSize)} bold style={{ flex: 1 }}>
				{money(amounts.net)}
			</Text>
		</div>
	);

	const body = compact ? (
		<div
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "column",
				justifyContent: "center",
				gap: metric(6),
			}}
		>
			<Text size={font(18)}>{`Earned today · ${updatedAt}`}</Text>
			<Text size={font(kind === "banner" ? 56 : 34)} bold>
				{money(today.gross)}
			</Text>
			<Text size={font(kind === "banner" ? 30 : 22)}>
				{`${money(today.net)} after tax`}
			</Text>
			{dots}
			<Text size={font(kind === "banner" ? 22 : 16, 14)}>{status}</Text>
		</div>
	) : (
		<div
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: metric(8) }}>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "flex-end",
					}}
				>
					<Text size={font(30)} bold>
						Earned so far
					</Text>
					<Text
						size={font(18)}
					>{`${payType} · ${provinceName} · ${updatedAt}`}</Text>
				</div>
				{dots}
				<Text size={font(kind === "full" ? 24 : 20)} bold>
					{status}
				</Text>
			</div>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{columnHeaders}
				{row("Today", today, kind === "full" ? 52 : 34)}
				{row("This week", week, kind === "full" ? 38 : 28)}
				{row("This month", month, kind === "full" ? 38 : 28)}
			</div>
		</div>
	);

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<ScreenCanvas screen={screenProfile}>{body}</ScreenCanvas>
		</PreSatori>
	);
}

function clockLabel(epochMs: number, timezone: string): string {
	const format = (tz: string) =>
		new Intl.DateTimeFormat("en-GB", {
			timeZone: tz,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).format(new Date(epochMs));
	try {
		return format(timezone);
	} catch {
		return format("UTC");
	}
}

function isProvince(value: string): value is ProvinceCode {
	return PROVINCE_OPTIONS.some((option) => option.value === value);
}

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "salary-ticker",
		title: "Salary Ticker",
		description:
			"How much you have earned today, this week and this month, before and after Canadian tax, CPP and EI, with a row of dots for how much of today's workday has gone and when you finish. Set your pay as an annual, monthly, daily or hourly rate. Time uses the device's timezone.",
		published: true,
		tags: ["money", "salary", "income", "time", "canada", "fork"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-10-26T00:00:00Z",
		updatedAt: "2026-10-26T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params, context) => {
		const timezone = context?.deviceTimezone ?? DEFAULT_TIMEZONE;
		const now = Date.now();
		const startMinutes = parseTime(params.startTime, DEFAULT_START);
		const endMinutes = parseTime(params.endTime, DEFAULT_END);
		const config: PayConfig = {
			payType: parsePayType(params.payType),
			amount: params.amount,
			workDays: parseWorkDays(params.workDays),
			startMinutes,
			endMinutes,
			breakMinutes: Math.max(0, params.breakMinutes),
		};
		const province = isProvince(params.province)
			? params.province
			: DEFAULT_PROVINCE;
		const share = takeHomeShare(
			annualGross(config),
			province,
			yearIn(now, timezone),
		);
		const gross = earnings(config, now, timezone);
		const both = (value: number) => ({
			gross: value,
			net: Math.round(value * share * 100) / 100,
		});
		const progress = workdayProgress(config, now, timezone);
		return {
			currency: currencySymbol(params.currency),
			provinceName:
				PROVINCE_OPTIONS.find((o) => o.value === province)?.label ?? "",
			takeHomePercent: Math.round(share * 100),
			payType: config.payType,
			today: both(gross.today),
			week: both(gross.week),
			month: both(gross.month),
			updatedAt: clockLabel(now, timezone),
			startTime: params.startTime,
			endTime: params.endTime,
			dayState: progress.state,
			dayPercent: progress.percent,
			minutesLeft: progress.minutesLeft,
		};
	},
	Component: ({ width, height, screen, data }) => (
		<SalaryTicker {...data} width={width} height={height} screen={screen} />
	),
};
