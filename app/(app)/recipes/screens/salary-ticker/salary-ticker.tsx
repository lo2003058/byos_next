import { z } from "zod";
import type { RecipeDefinition } from "@/lib/recipes/types";
import {
	DEFAULT_PROVINCE,
	PROVINCE_OPTIONS,
	type ProvinceCode,
	takeHomeShare,
} from "./canada-tax";
import {
	CURRENCY_OPTIONS,
	currencySymbol,
	PAY_TYPE_OPTIONS,
	TIME_OPTIONS,
} from "./options";
import {
	annualGross,
	earnings,
	hourlyRate,
	type PayConfig,
	parsePayType,
	parseTime,
	parseWorkDays,
	workdayProgress,
	yearIn,
} from "./pay";
import SalaryView from "./salary-view";

const DEFAULT_TIMEZONE = "America/Toronto";
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 18 * 60;

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
	/** Pay per paid hour of work. */
	hourly: amountsSchema.default({ gross: 0, net: 0 }),
	updatedAt: z.string().default(""),
	startTime: z.string().default("09:00"),
	endTime: z.string().default("18:00"),
	dayState: z.enum(["off", "before", "working", "done"]).default("off"),
	dayPercent: z.number().default(0),
	minutesLeft: z.number().default(0),
});

export type SalaryData = z.infer<typeof dataSchema>;

export { default } from "./salary-view";

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
			hourly: both(hourlyRate(config, now, timezone)),
			updatedAt: clockLabel(now, timezone),
			startTime: params.startTime,
			endTime: params.endTime,
			dayState: progress.state,
			dayPercent: progress.percent,
			minutesLeft: progress.minutesLeft,
		};
	},
	Component: ({ width, height, screen, data }) => (
		<SalaryView {...data} width={width} height={height} screen={screen} />
	),
};
