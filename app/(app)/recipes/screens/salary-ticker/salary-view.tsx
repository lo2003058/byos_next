import type { ReactNode } from "react";
import {
	ScreenCanvas,
	screenFontSize,
	screenMetric,
} from "@/components/trmnl/screen-layout";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import {
	createScreenProfile,
	type ScreenProfile,
} from "@/lib/trmnl/screen-profile";
import { slotKind } from "@/lib/trmnl/slot-kind";
import { PreSatori } from "@/utils/pre-satori";
import { Text } from "../year-progress/ui";
import { formatMoney, formatRate } from "./format";
import { parseTime } from "./pay";
import type { SalaryData } from "./salary-ticker";
import { dayLine, WorkdayDots } from "./workday";

const DEFAULT_START = 9 * 60;
const DEFAULT_END = 18 * 60;
/** One dot for every half hour of the working day. */
const DOT_MINUTES = 30;
const NO_AMOUNTS = { gross: 0, net: 0 };

type Props = Partial<SalaryData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
};

type Amounts = { gross: number; net: number };

export default function SalaryTicker({
	currency = "$",
	provinceName = "",
	takeHomePercent = 100,
	today = NO_AMOUNTS,
	week = NO_AMOUNTS,
	month = NO_AMOUNTS,
	hourly = NO_AMOUNTS,
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
	const profile = screen ?? createScreenProfile({ width, height });
	const kind = slotKind(profile);
	const metric = (value: number) => screenMetric(profile, value);
	const font = (value: number, min = 14) => screenFontSize(profile, value, min);
	const gap = metric(kind === "full" ? 14 : 10);
	const padding = metric(kind === "full" ? 28 : 18);
	const innerWidth = profile.logicalWidth - padding * 2;
	const money = (value: number) => formatMoney(value, currency);
	const rate = (perHour: number, divisor: number) =>
		formatRate(perHour / divisor, currency);
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
	const status = dayLine(dayState, minutesLeft, startTime, endTime);
	const percentText = dayState === "off" ? "—" : `${dayPercent}%`;

	const caption = (text: string, size = 16) => (
		<Text
			size={font(size, 14)}
			style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
		>
			{text}
		</Text>
	);

	const box = (children: ReactNode, flex = 1, bold = false) => (
		<div
			style={{
				display: "flex",
				flex,
				flexDirection: "column",
				justifyContent: "center",
				gap: metric(2),
				minWidth: 0,
				padding: `${metric(8)}px ${metric(14)}px`,
				border: `${metric(bold ? 5 : 2)}px solid #000`,
				borderRadius: metric(14),
				backgroundColor: "#fff",
				color: "#000",
			}}
		>
			{children}
		</div>
	);

	const hero = (size: number, stacked: boolean, short = false) => (
		<div
			style={{
				display: "flex",
				flexDirection: stacked ? "column" : "row",
				gap,
			}}
		>
			{box(
				<>
					{caption("Before tax")}
					<Text size={font(size)} bold style={{ lineHeight: 1 }}>
						{money(today.gross)}
					</Text>
				</>,
			)}
			{box(
				<>
					{caption(
						short ? "After tax" : `After tax · keep ${takeHomePercent}%`,
					)}
					<Text size={font(size)} bold style={{ lineHeight: 1 }}>
						{money(today.net)}
					</Text>
				</>,
				1,
				true,
			)}
		</div>
	);

	const progress = (
		percentSize: number,
		dotMax: number,
		available = innerWidth,
	) => (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: metric(16),
			}}
		>
			<Text size={font(percentSize)} bold style={{ lineHeight: 1 }}>
				{percentText}
			</Text>
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					gap: metric(6),
				}}
			>
				<WorkdayDots
					count={dotCount}
					percent={dayPercent}
					state={dayState}
					width={available - metric(percentSize * 2.4)}
					maxSize={dotMax}
				/>
				<Text size={font(18)}>{status}</Text>
			</div>
		</div>
	);

	const period = (label: string, amounts: Amounts) =>
		box(
			<>
				{caption(label, 15)}
				<Text size={font(32)} bold style={{ lineHeight: 1 }}>
					{money(amounts.net)}
				</Text>
				<Text size={font(18)}>{`${money(amounts.gross)} before`}</Text>
			</>,
		);

	const rateRow = (unit: string, divisor: number) => (
		<div
			key={unit}
			style={{ display: "flex", flexDirection: "row", alignItems: "baseline" }}
		>
			<Text size={font(16)} style={{ width: metric(54) }}>
				{unit}
			</Text>
			<Text size={font(22)} bold style={{ flex: 1 }}>
				{rate(hourly.net, divisor)}
			</Text>
			<Text size={font(17)}>{rate(hourly.gross, divisor)}</Text>
		</div>
	);

	const rateBox = box(
		<>
			{caption("Earning · after / before", 15)}
			{rateRow("/sec", 3600)}
			{rateRow("/min", 60)}
			{rateRow("/hr", 1)}
		</>,
		1.35,
	);

	const header = (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "baseline",
			}}
		>
			<Text
				size={font(22)}
				bold
				style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}
			>
				Earned today
			</Text>
			<Text size={font(18)}>{`${provinceName} · ${updatedAt}`}</Text>
		</div>
	);

	let body: ReactNode;
	if (kind === "full") {
		body = (
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					justifyContent: "space-between",
				}}
			>
				{header}
				{hero(74, false)}
				{progress(56, 36)}
				<div style={{ display: "flex", flexDirection: "row", gap }}>
					{period("This week", week)}
					{period("This month", month)}
					{rateBox}
				</div>
			</div>
		);
	} else if (kind === "half") {
		body = (
			<div style={{ display: "flex", flex: 1, flexDirection: "column", gap }}>
				{header}
				{hero(46, true)}
				{progress(40, 24)}
				<div style={{ display: "flex", flex: 1, flexDirection: "row", gap }}>
					{period("Week", week)}
					{period("Month", month)}
				</div>
				{rateBox}
			</div>
		);
	} else if (kind === "banner") {
		body = (
			<div style={{ display: "flex", flex: 1, flexDirection: "row", gap }}>
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						justifyContent: "center",
						gap,
					}}
				>
					{header}
					{hero(46, false, true)}
				</div>
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						justifyContent: "center",
						gap: metric(8),
					}}
				>
					{progress(44, 20, Math.round((innerWidth - gap) / 2))}
					<Text
						size={font(20)}
					>{`${formatRate(hourly.net, currency)}/hr after tax`}</Text>
				</div>
			</div>
		);
	} else {
		body = (
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					justifyContent: "center",
					gap: metric(8),
				}}
			>
				{caption(`Earned today · ${updatedAt}`, 14)}
				<Text size={font(40)} bold style={{ lineHeight: 1 }}>
					{money(today.gross)}
				</Text>
				<Text size={font(22)}>{`${money(today.net)} after tax`}</Text>
				<WorkdayDots
					count={dotCount}
					percent={dayPercent}
					state={dayState}
					width={innerWidth}
					maxSize={14}
				/>
				<Text size={font(16)}>{`${percentText} · ${status}`}</Text>
			</div>
		);
	}

	return (
		<PreSatori width={profile.logicalWidth} height={profile.logicalHeight}>
			<ScreenCanvas screen={profile}>{body}</ScreenCanvas>
		</PreSatori>
	);
}
