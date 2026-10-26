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
import { Text } from "../year-progress/ui";
import { afterTax, formatMoney } from "./format";
import { earnings, parsePayType, parseTime, parseWorkDays } from "./pay";

const DEFAULT_TIMEZONE = "America/Toronto";
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 18 * 60;

export const paramsSchema = z.object({
	payType: z
		.string()
		.default("monthly")
		.describe("How you are paid: annual, monthly, daily or hourly")
		.meta({ title: "Pay type", placeholder: "monthly" }),
	amount: z
		.number()
		.default(30000)
		.describe("Your pay before tax, per year, month, day or hour")
		.meta({ title: "Pay before tax" }),
	taxRate: z
		.number()
		.default(10)
		.describe("Tax taken off your pay, in percent (0-100)")
		.meta({ title: "Tax rate (%)" }),
	currency: z
		.string()
		.default("$")
		.describe("Symbol shown before each amount")
		.meta({ title: "Currency symbol", placeholder: "$" }),
	workDays: z
		.string()
		.default("Mon-Fri")
		.describe("Days you work, e.g. Mon-Fri, Mon-Sat or Mon,Wed,Fri")
		.meta({ title: "Work days", placeholder: "Mon-Fri" }),
	startTime: z
		.string()
		.default("09:00")
		.describe("When your workday starts (24-hour HH:MM)")
		.meta({ title: "Start time", placeholder: "09:00" }),
	endTime: z
		.string()
		.default("18:00")
		.describe("When your workday ends (24-hour HH:MM)")
		.meta({ title: "End time", placeholder: "18:00" }),
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
	taxRate: z.number().default(0),
	payType: z.string().default("monthly"),
	today: amountsSchema.default({ gross: 0, net: 0 }),
	week: amountsSchema.default({ gross: 0, net: 0 }),
	month: amountsSchema.default({ gross: 0, net: 0 }),
	updatedAt: z.string().default(""),
});

type SalaryData = z.infer<typeof dataSchema>;

type Props = Partial<SalaryData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

const NO_AMOUNTS = { gross: 0, net: 0 };

export default function SalaryTicker({
	currency = "$",
	taxRate = 0,
	payType = "monthly",
	today = NO_AMOUNTS,
	week = NO_AMOUNTS,
	month = NO_AMOUNTS,
	updatedAt = "",
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Props) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(screenProfile);
	const metric = (value: number) => screenMetric(screenProfile, value);
	const font = (value: number, min = 14) =>
		screenFontSize(screenProfile, value, min);
	const compact = kind === "quarter" || kind === "banner";
	const money = (value: number) => formatMoney(value, currency);

	const columnHeaders = (
		<div style={{ display: "flex", flexDirection: "row" }}>
			<div style={{ display: "flex", flex: 1 }} />
			<Text size={font(18)} style={{ flex: 1 }}>
				Before tax
			</Text>
			<Text size={font(18)} style={{ flex: 1 }}>
				{`After tax (${taxRate}%)`}
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
				gap: metric(4),
			}}
		>
			<Text size={font(18)}>{`Earned today · ${updatedAt}`}</Text>
			<Text size={font(kind === "banner" ? 64 : 34)} bold>
				{money(today.gross)}
			</Text>
			<Text size={font(kind === "banner" ? 36 : 22)}>
				{`${money(today.net)} after tax`}
			</Text>
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
				<Text size={font(18)}>{`${payType} · ${updatedAt}`}</Text>
			</div>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{columnHeaders}
				{row("Today", today, kind === "full" ? 56 : 34)}
				{row("This week", week, kind === "full" ? 40 : 28)}
				{row("This month", month, kind === "full" ? 40 : 28)}
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

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "salary-ticker",
		title: "Salary Ticker",
		description:
			"How much you have earned today, this week and this month, before and after tax. Set your pay as an annual, monthly, daily or hourly rate, plus your work days and hours. Time uses the device's timezone.",
		published: true,
		tags: ["money", "salary", "income", "time", "fork"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.1.0",
		createdAt: "2026-10-26T00:00:00Z",
		updatedAt: "2026-10-26T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params, context) => {
		const timezone = context?.deviceTimezone ?? DEFAULT_TIMEZONE;
		const now = Date.now();
		const payType = parsePayType(params.payType);
		const gross = earnings(
			{
				payType,
				amount: params.amount,
				workDays: parseWorkDays(params.workDays),
				startMinutes: parseTime(params.startTime, DEFAULT_START),
				endMinutes: parseTime(params.endTime, DEFAULT_END),
				breakMinutes: Math.max(0, params.breakMinutes),
			},
			now,
			timezone,
		);
		const both = (value: number) => ({
			gross: value,
			net: afterTax(value, params.taxRate),
		});
		return {
			currency: params.currency,
			taxRate: params.taxRate,
			payType,
			today: both(gross.today),
			week: both(gross.week),
			month: both(gross.month),
			updatedAt: clockLabel(now, timezone),
		};
	},
	Component: ({ width, height, screen, data }) => (
		<SalaryTicker {...data} width={width} height={height} screen={screen} />
	),
};
