import { z } from "zod";
import {
	ScreenCanvas,
	ScreenFooter,
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
import { PreSatori } from "@/utils/pre-satori";
import getTtcArrivals from "./getData";

export const paramsSchema = z.object({
	stopIds: z
		.string()
		.default("8126")
		.describe(
			"TTC stop codes (printed on the stop sign), comma separated. Each stop gets its own section",
		)
		.meta({ title: "Stop codes", placeholder: "12816, 8215" }),
	labels: z
		.string()
		.default("")
		.describe(
			"Names for the sections in the same order as the stop codes, comma separated. Leave empty to use the stop names",
		)
		.meta({ title: "Section labels", placeholder: "Eastbound, Westbound" }),
	routes: z
		.string()
		.default("")
		.describe("Only show these routes, comma separated. Leave empty for all")
		.meta({ title: "Routes", placeholder: "53, 953" }),
	limit: z
		.number()
		.default(3)
		.describe("Maximum number of arrivals shown per stop")
		.meta({ title: "Arrivals per stop" }),
	timezone: z
		.string()
		.default("America/Toronto")
		.describe("Timezone used for the updated time in the footer")
		.meta({ title: "Timezone", placeholder: "America/Toronto" }),
});

const arrivalSchema = z.object({
	route: z.string(),
	routeTitle: z.string(),
	destination: z.string(),
	minutes: z.number(),
	seconds: z.number(),
});

const sectionSchema = z.object({
	label: z.string(),
	arrivals: z.array(arrivalSchema).default([]),
	error: z.string().default(""),
});

export const dataSchema = z.object({
	sections: z.array(sectionSchema).default([]),
	updatedAt: z.string().default(""),
});

type TtcArrivalsData = z.infer<typeof dataSchema>;

const MAX_SECTIONS = 3;

function minutesLabel(minutes: number): string {
	return minutes < 1 ? "Now" : `${minutes}`;
}

type Section = TtcArrivalsData["sections"][number];

function SectionView({
	section,
	screen,
	dense,
	isLast,
}: {
	section: Section;
	screen: ScreenProfile;
	dense: boolean;
	isLast: boolean;
}) {
	const rows = section.arrivals;
	const routeFont = screenFontSize(screen, dense ? 26 : 38, 18);
	const destFont = screenFontSize(screen, dense ? 22 : 26, 16);
	const minutesFont = screenFontSize(screen, dense ? 32 : 48, 20);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				gap: screenMetric(screen, 4),
				overflow: "hidden",
				borderBottom: isLast
					? "none"
					: `${Math.max(2, screenMetric(screen, 3))}px solid #000`,
				paddingBottom: isLast ? 0 : screenMetric(screen, 6),
			}}
		>
			<div
				style={{
					display: "flex",
					fontSize: screenFontSize(screen, dense ? 20 : 28, 16),
					fontWeight: 700,
					lineHeight: 1.1,
					overflow: "hidden",
					whiteSpace: "nowrap",
				}}
			>
				{section.label}
			</div>
			{rows.length === 0 ? (
				<div
					style={{
						display: "flex",
						flex: 1,
						alignItems: "center",
						fontSize: screenFontSize(screen, dense ? 22 : 30, 16),
					}}
				>
					{section.error ? "Can't reach TTC" : "No upcoming vehicles"}
				</div>
			) : (
				rows.map((arrival, index) => (
					<div
						key={`${arrival.route}-${arrival.seconds}-${index}`}
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							flex: 1,
							gap: screenMetric(screen, 12),
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flex: "none",
								minWidth: screenMetric(screen, dense ? 78 : 96),
								padding: `${screenMetric(screen, 1)}px ${screenMetric(screen, 8)}px`,
								borderRadius: screenMetric(screen, 8),
								backgroundColor: "#000",
								color: "#fff",
								fontSize: routeFont,
								fontWeight: 700,
							}}
						>
							{arrival.route}
						</div>
						<div
							style={{
								display: "flex",
								flex: 1,
								overflow: "hidden",
								whiteSpace: "nowrap",
								fontSize: destFont,
							}}
						>
							{arrival.destination}
						</div>
						<div
							style={{
								display: "flex",
								flex: "none",
								alignItems: "baseline",
								gap: screenMetric(screen, 6),
								fontWeight: 700,
							}}
						>
							<div style={{ display: "flex", fontSize: minutesFont }}>
								{minutesLabel(arrival.minutes)}
							</div>
							{arrival.minutes >= 1 ? (
								<div
									style={{
										display: "flex",
										fontSize: screenFontSize(screen, 18, 16),
										fontWeight: 400,
									}}
								>
									min
								</div>
							) : null}
						</div>
					</div>
				))
			)}
		</div>
	);
}

export default function TtcArrivals({
	sections,
	updatedAt,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Partial<TtcArrivalsData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
}) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const shown = (sections ?? []).slice(0, MAX_SECTIONS);
	const dense = shown.length > 1;

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<ScreenCanvas screen={screenProfile}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						gap: screenMetric(screenProfile, 6),
						overflow: "hidden",
					}}
				>
					{shown.length === 0 ? (
						<div
							style={{
								display: "flex",
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
								fontSize: screenFontSize(screenProfile, 32, 18),
								fontWeight: 700,
							}}
						>
							Add a TTC stop code
						</div>
					) : (
						shown.map((section, index) => (
							<SectionView
								key={`${section.label}-${index}`}
								section={section}
								screen={screenProfile}
								dense={dense}
								isLast={index === shown.length - 1}
							/>
						))
					)}
				</div>
				<ScreenFooter
					screen={screenProfile}
					left="TTC live arrivals"
					right={updatedAt ? `Updated ${updatedAt}` : undefined}
					style={{ backgroundColor: "#000" }}
				/>
			</ScreenCanvas>
		</PreSatori>
	);
}

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "ttc-arrivals",
		title: "TTC Arrivals",
		description:
			"Next buses and streetcars at one or more Toronto Transit Commission stops, one section per stop (e.g. eastbound and westbound), from the public TTC prediction feed. Does not cover subway lines.",
		published: true,
		tags: ["transit", "ttc", "toronto", "api", "live-data", "configurable"],
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-10-24T00:00:00Z",
		updatedAt: "2026-10-24T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getTtcArrivals(params),
	Component: ({ width, height, screen, data }) => (
		<TtcArrivals {...data} width={width} height={height} screen={screen} />
	),
};
