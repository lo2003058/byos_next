import { cloneElement, type ReactElement } from "react";
import { z } from "zod";
import {
	ScreenFooter,
	StatsGrid,
	screenCanvasPadding,
	screenMetric,
} from "@/components/trmnl/screen-layout";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import type { RecipeDefinition } from "@/lib/recipes/types";
import { to24Hour } from "@/lib/time/to-24-hour";
import { outlineFooterStyle } from "@/lib/trmnl/outline-footer";
import {
	createScreenProfile,
	type ScreenProfile,
} from "@/lib/trmnl/screen-profile";
import { PreSatori } from "@/utils/pre-satori";
import getWeatherDataInternal from "../weather/getData";
import {
	CloudIcon,
	FogIcon,
	humidityIcon,
	pressureIcon,
	RainIcon,
	SnowIcon,
	SunIcon,
	sunriseIcon,
	sunsetIcon,
	ThunderIcon,
	tempDown,
	tempIcon,
	tempUp,
	windIcon,
} from "../weather/icons";
import { gridColumns, selectStats } from "./stats";

export const paramsSchema = z.object({
	location: z
		.string()
		.default("Toronto, Canada")
		.describe("City or place name to fetch weather for")
		.meta({ title: "Location", placeholder: "Toronto, Canada" }),
	latitude: z
		.number()
		.default(0)
		.describe(
			"Optional exact latitude; when set with longitude, skips geocoding",
		)
		.meta({ title: "Latitude" }),
	longitude: z
		.number()
		.default(0)
		.describe(
			"Optional exact longitude; when set with latitude, skips geocoding",
		)
		.meta({ title: "Longitude" }),
	showHighLow: z
		.boolean()
		.default(true)
		.describe("Show today's high and low next to the icon")
		.meta({ title: "Show high / low" }),
	showFeelsLike: z
		.boolean()
		.default(true)
		.describe("Show the feels-like temperature")
		.meta({ title: "Show feels like" }),
	showHumidity: z
		.boolean()
		.default(true)
		.describe("Show relative humidity")
		.meta({ title: "Show humidity" }),
	showWind: z
		.boolean()
		.default(true)
		.describe("Show wind speed")
		.meta({ title: "Show wind speed" }),
	showPressure: z
		.boolean()
		.default(true)
		.describe("Show air pressure")
		.meta({ title: "Show pressure" }),
	showSunrise: z
		.boolean()
		.default(true)
		.describe("Show sunrise time")
		.meta({ title: "Show sunrise" }),
	showSunset: z
		.boolean()
		.default(true)
		.describe("Show sunset time")
		.meta({ title: "Show sunset" }),
});

type ShowFlags = Pick<
	z.infer<typeof paramsSchema>,
	| "showHighLow"
	| "showFeelsLike"
	| "showHumidity"
	| "showWind"
	| "showPressure"
	| "showSunrise"
	| "showSunset"
>;

export const dataSchema = z.object({
	temperature: z.string().default("Loading..."),
	feelsLike: z.string().default("Loading..."),
	humidity: z.string().default("Loading..."),
	windSpeed: z.string().default("Loading..."),
	description: z.string().default("Loading..."),
	location: z.string().default("Loading..."),
	lastUpdated: z.string().default("Loading..."),
	highTemp: z.string().default("Loading..."),
	lowTemp: z.string().default("Loading..."),
	pressure: z.string().default("Loading..."),
	sunset: z.string().default("Loading..."),
	sunrise: z.string().default("Loading..."),
	latitude: z.number().default(0),
	longitude: z.number().default(0),
	suggestion: z.string().default(""),
});

interface WeatherProps {
	temperature?: string;
	feelsLike?: string;
	humidity?: string;
	windSpeed?: string;
	description?: string;
	location?: string;
	lastUpdated?: string;
	highTemp?: string;
	lowTemp?: string;
	pressure?: string;
	sunset?: string;
	sunrise?: string;
	latitude?: number;
	longitude?: number;
	suggestion?: string;
	width?: number;
	height?: number;
	screen?: ScreenProfile;
	show?: Partial<ShowFlags>;
}

export default function WeatherYin({
	temperature = "Loading...",
	feelsLike = "Loading...",
	humidity = "Loading...",
	windSpeed = "Loading...",
	description = "Loading...",
	location = "Loading...",
	lastUpdated = "Loading...",
	highTemp = "Loading...",
	lowTemp = "Loading...",
	pressure = "Loading...",
	sunset = "Loading...",
	sunrise = "Loading...",
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	screen,
	show = {},
}: WeatherProps) {
	const screenProfile = screen ?? createScreenProfile({ width, height });
	// Weather statistics
	const weatherStats = selectStats(
		[
			{
				key: "showHighLow",
				label: "High",
				value: `${highTemp}°C`,
				icon: tempUp,
			},
			{
				key: "showHighLow",
				label: "Low",
				value: `${lowTemp}°C`,
				icon: tempDown,
			},
			{
				key: "showFeelsLike",
				label: "Feels Like",
				value: `${feelsLike}°C`,
				icon: tempIcon,
			},
			{
				key: "showHumidity",
				label: "Humidity",
				value: `${humidity}%`,
				icon: humidityIcon,
			},
			{
				key: "showWind",
				label: "Wind Speed",
				value: `${windSpeed} km/h`,
				icon: windIcon,
			},
			{
				key: "showPressure",
				label: "Pressure",
				value: `${pressure} hPa`,
				icon: pressureIcon,
			},
			{
				key: "showSunrise",
				label: "Sunrise",
				value: `${sunrise}`,
				icon: sunriseIcon,
			},
			{
				key: "showSunset",
				label: "Sunset",
				value: `${sunset}`,
				icon: sunsetIcon,
			},
		],
		show,
	);

	// Get weather icon based on description
	const getWeatherIcon = (desc: string) => {
		const lowerDesc = desc.toLowerCase();
		if (lowerDesc.includes("rain") || lowerDesc.includes("drizzle"))
			return RainIcon;
		if (lowerDesc.includes("snow")) return SnowIcon;
		if (lowerDesc.includes("cloud")) return CloudIcon;
		if (lowerDesc.includes("clear") || lowerDesc.includes("sun"))
			return SunIcon;
		if (lowerDesc.includes("fog") || lowerDesc.includes("mist")) return FogIcon;
		if (lowerDesc.includes("thunder")) return ThunderIcon;
		return CloudIcon; // default
	};

	const isHalfScreen = screenProfile.isHalfScreen;
	// Same outer margin as ScreenCanvas so footers line up with other recipes.
	const canvasPadding = screenCanvasPadding(screenProfile);
	// Icons are static <svg> constants and Takumi needs explicit pixel sizes
	// (percent sizes render nothing), so scale them from logical screen metrics.
	const sizeIcon = (icon: ReactElement, base: number) => {
		const px = screenMetric(screenProfile, base);
		return cloneElement(
			icon as ReactElement<{ width?: number; height?: number }>,
			{ width: px, height: px },
		);
	};

	return (
		<PreSatori
			width={screenProfile.logicalWidth}
			height={screenProfile.logicalHeight}
		>
			<div className="flex flex-col w-full h-full bg-white text-black">
				<div
					className={`flex sm:flex-row items-center justify-between ${isHalfScreen ? "flex-row" : "flex-col sm:flex-row"}`}
					style={{ padding: canvasPadding }}
				>
					<h2
						className={`font-inter leading-none ${isHalfScreen ? "text-8xl" : "text-9xl 2xl:text-[12rem]"}`}
					>
						{temperature}°C
					</h2>
					<div className="flex flex-col items-center justify-center">
						<div className="flex items-center justify-center">
							{sizeIcon(getWeatherIcon(description), 128)}
						</div>
					</div>
				</div>
				<div
					className="flex flex-col flex-1"
					style={{
						padding: canvasPadding,
						paddingTop: 0,
						gap: screenMetric(screenProfile, isHalfScreen ? 8 : 16),
					}}
				>
					{weatherStats.length > 0 ? (
						<StatsGrid
							screen={screenProfile}
							stats={weatherStats.map((stat) => ({
								label: stat.label,
								value: stat.value,
								icon: sizeIcon(stat.icon, 48),
							}))}
							columns={gridColumns(weatherStats.length, isHalfScreen)}
							align="center"
							fill
						/>
					) : (
						<div style={{ display: "flex", flex: 1 }} />
					)}
					<ScreenFooter
						screen={screenProfile}
						left={lastUpdated || location}
						right={lastUpdated ? location : undefined}
						style={outlineFooterStyle()}
					/>
				</div>
			</div>
		</PreSatori>
	);
}

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "weather-yin",
		title: "Weather (Outline)",
		description:
			"Fork variant of the weather screen: outlined footer instead of a filled one, 24-hour times, Toronto by default.",
		published: true,
		tags: ["tailwind", "weather", "api", "live-data", "configurable"],
		author: { name: "fork" },
		category: "display-components",
		version: "0.1.0",
		createdAt: "2026-10-24T00:00:00Z",
		updatedAt: "2026-10-24T00:00:00Z",
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => {
		const data = await getWeatherDataInternal({
			location: params.location,
			latitude: params.latitude,
			longitude: params.longitude,
		});
		return {
			...data,
			sunrise: to24Hour(data.sunrise),
			sunset: to24Hour(data.sunset),
			lastUpdated: to24Hour(data.lastUpdated),
		} as z.infer<typeof dataSchema>;
	},
	Component: ({ width, height, screen, params, data }) => (
		<WeatherYin
			{...data}
			width={width}
			height={height}
			screen={screen}
			show={params}
		/>
	),
};
