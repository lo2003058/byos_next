import { screenFontSize, screenMetric } from "@/components/trmnl/screen-layout";
import type { ScreenProfile } from "@/lib/trmnl/screen-profile";
import { daysUntilLabel, shortDate } from "./holidays";
import { LongWeekend, Text } from "./ui";

export type Holiday = {
	date: string;
	name: string;
	weekday: string;
	daysUntil: number;
	longWeekend: boolean;
};

const rule = (screen: ScreenProfile) =>
	`${Math.max(1, screenMetric(screen, 2))}px solid #000`;

/** Two-line holiday entry: name and days to go, then the date and a tag. */
export function HolidayRow({
	holiday,
	screen,
	big,
}: {
	holiday: Holiday;
	screen: ScreenProfile;
	big?: boolean;
}) {
	const nameSize = screenFontSize(screen, big ? 26 : 22, 14);
	const metaSize = screenFontSize(screen, big ? 18 : 16, 12);
	return (
		<div
			data-holiday={holiday.date}
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "row",
				alignItems: "center",
				gap: screenMetric(screen, 10),
				borderBottom: rule(screen),
				overflow: "hidden",
			}}
		>
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
					<Text size={metaSize}>
						{`${holiday.weekday}, ${shortDate(holiday.date)}`}
					</Text>
					{holiday.longWeekend ? (
						<LongWeekend screen={screen} size={metaSize} />
					) : null}
				</div>
			</div>
			<Text
				size={metaSize + 2}
				bold
				style={{ flex: "none", justifyContent: "flex-end" }}
			>
				{daysUntilLabel(holiday.daysUntil)}
			</Text>
		</div>
	);
}

/** Titled list of holidays, or a message when there is none or the feed failed. */
export function HolidayPanel({
	holidays,
	error,
	provinceName,
	rows,
	screen,
	width,
	showTitle = true,
	big,
}: {
	holidays: Holiday[];
	error: string;
	provinceName: string;
	rows: number;
	screen: ScreenProfile;
	width: number;
	showTitle?: boolean;
	big?: boolean;
}) {
	const shown = holidays.slice(0, rows);
	const message = error || (shown.length === 0 ? "No upcoming holidays" : "");
	const titleSize = screenFontSize(screen, big ? 24 : 20, 14);

	return (
		<div
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "column",
				width,
				overflow: "hidden",
				gap: screenMetric(screen, 4),
			}}
		>
			{showTitle ? (
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						borderBottom: rule(screen),
						paddingBottom: screenMetric(screen, 4),
					}}
				>
					<Text size={titleSize} bold>
						Public holidays
					</Text>
					<Text size={Math.round(titleSize * 0.8)}>{provinceName}</Text>
				</div>
			) : null}
			{message ? (
				<div
					style={{
						display: "flex",
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text size={screenFontSize(screen, 20, 14)} bold>
						{message}
					</Text>
				</div>
			) : (
				<div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
					{shown.map((holiday) => (
						<HolidayRow
							key={holiday.date + holiday.name}
							holiday={holiday}
							screen={screen}
							big={big}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/** Holidays as side-by-side cards, for the wide, short slot. */
export function HolidayCards({
	holidays,
	error,
	count,
	screen,
}: {
	holidays: Holiday[];
	error: string;
	count: number;
	screen: ScreenProfile;
}) {
	const shown = holidays.slice(0, count);
	const message = error || (shown.length === 0 ? "No upcoming holidays" : "");
	if (message) {
		return (
			<div
				style={{
					display: "flex",
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text size={screenFontSize(screen, 20, 14)} bold>
					{message}
				</Text>
			</div>
		);
	}
	return (
		<div
			style={{
				display: "flex",
				flex: 1,
				flexDirection: "row",
				gap: screenMetric(screen, 8),
			}}
		>
			{shown.map((holiday) => (
				<div
					key={holiday.date + holiday.name}
					data-holiday={holiday.date}
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						justifyContent: "space-between",
						overflow: "hidden",
						border: `${Math.max(2, screenMetric(screen, 3))}px solid #000`,
						borderRadius: screenMetric(screen, 10),
						padding: screenMetric(screen, 8),
					}}
				>
					<Text size={screenFontSize(screen, 20, 14)} bold>
						{holiday.name}
					</Text>
					<Text size={screenFontSize(screen, 16, 12)}>
						{`${holiday.weekday}, ${shortDate(holiday.date)}`}
					</Text>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							gap: screenMetric(screen, 3),
						}}
					>
						{holiday.longWeekend ? (
							<LongWeekend
								screen={screen}
								size={screenFontSize(screen, 12, 10)}
							/>
						) : null}
						<Text size={screenFontSize(screen, 18, 12)} bold>
							{daysUntilLabel(holiday.daysUntil)}
						</Text>
					</div>
				</div>
			))}
		</div>
	);
}
