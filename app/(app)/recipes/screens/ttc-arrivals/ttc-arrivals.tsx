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
	stopId: z
		.string()
		.default("8126")
		.describe("TTC stop code, printed on the stop sign or shown in Google Maps")
		.meta({ title: "Stop code", placeholder: "8126" }),
	routes: z
		.string()
		.default("")
		.describe("Only show these routes, comma separated. Leave empty for all")
		.meta({ title: "Routes", placeholder: "510, 310" }),
	limit: z
		.number()
		.default(5)
		.describe("Maximum number of arrivals to show")
		.meta({ title: "Arrivals to show" }),
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

export const dataSchema = z.object({
	stopTitle: z.string().default(""),
	arrivals: z.array(arrivalSchema).default([]),
	updatedAt: z.string().default(""),
	error: z.string().default(""),
});

type TtcArrivalsData = z.infer<typeof dataSchema>;

const MAX_ROWS = 8;

function minutesLabel(minutes: number): string {
	return minutes < 1 ? "Now" : `${minutes}`;
}

export default function TtcArrivals({
	stopTitle,
	arrivals,
	updatedAt,
	error,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
}: Partial<TtcArrivalsData> & {
	width?: number;
	height?: number;
	screen?: ScreenProfile;
}) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	const rows = (arrivals ?? []).slice(0, MAX_ROWS);
	const emptyMessage = error ? "Can't reach TTC" : "No upcoming vehicles";

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
						gap: screenMetric(screenProfile, 8),
						overflow: "hidden",
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: screenFontSize(screenProfile, 30, 18),
							fontWeight: 700,
							lineHeight: 1.1,
							overflow: "hidden",
							whiteSpace: "nowrap",
						}}
					>
						{stopTitle || "TTC arrivals"}
					</div>
					{rows.length === 0 ? (
						<div
							style={{
								display: "flex",
								flex: 1,
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: screenMetric(screenProfile, 8),
								fontSize: screenFontSize(screenProfile, 36, 18),
								fontWeight: 700,
							}}
						>
							<div style={{ display: "flex" }}>{emptyMessage}</div>
							{error ? (
								<div
									style={{
										display: "flex",
										fontSize: screenFontSize(screenProfile, 18, 16),
										fontWeight: 400,
									}}
								>
									{error}
								</div>
							) : null}
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
									gap: screenMetric(screenProfile, 14),
									borderBottom:
										index === rows.length - 1
											? "none"
											: `${Math.max(2, screenMetric(screenProfile, 2))}px solid #000`,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flex: "none",
										minWidth: screenMetric(screenProfile, 96),
										padding: `${screenMetric(screenProfile, 2)}px ${screenMetric(screenProfile, 8)}px`,
										borderRadius: screenMetric(screenProfile, 8),
										backgroundColor: "#000",
										color: "#fff",
										fontSize: screenFontSize(screenProfile, 38, 18),
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
										fontSize: screenFontSize(screenProfile, 26, 16),
									}}
								>
									{arrival.destination}
								</div>
								<div
									style={{
										display: "flex",
										flex: "none",
										alignItems: "baseline",
										gap: screenMetric(screenProfile, 6),
										fontWeight: 700,
									}}
								>
									<div
										style={{
											display: "flex",
											fontSize: screenFontSize(screenProfile, 48, 24),
										}}
									>
										{minutesLabel(arrival.minutes)}
									</div>
									{arrival.minutes >= 1 ? (
										<div
											style={{
												display: "flex",
												fontSize: screenFontSize(screenProfile, 20, 16),
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
			"Next buses and streetcars at a Toronto Transit Commission stop, from the public TTC prediction feed. Does not cover subway lines.",
		published: true,
		tags: ["transit", "ttc", "toronto", "api", "live-data", "configurable"],
		category: "display-components",
		version: "0.1.0",
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
