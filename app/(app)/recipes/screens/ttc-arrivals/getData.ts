import { fetchTtcPredictions, type TtcArrival } from "@/lib/ttc/predictions";

export type TtcArrivalsParams = {
	stopId: string;
	routes: string;
	limit: number;
	timezone: string;
};

export type TtcArrivalsData = {
	stopTitle: string;
	arrivals: TtcArrival[];
	updatedAt: string;
	error: string;
};

const splitRoutes = (routes: string): string[] =>
	routes
		.split(",")
		.map((route) => route.trim())
		.filter(Boolean);

function formatTime(timezone: string): string {
	try {
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(new Date());
	} catch {
		return "";
	}
}

/**
 * Never throws: a device must always receive an image, so feed failures are
 * returned as `error` and drawn on screen instead.
 */
export default async function getData(
	params: TtcArrivalsParams,
): Promise<TtcArrivalsData> {
	const updatedAt = formatTime(params.timezone);
	try {
		const result = await fetchTtcPredictions(params.stopId, {
			routes: splitRoutes(params.routes),
			limit: params.limit,
		});
		return { ...result, updatedAt, error: "" };
	} catch (error) {
		console.error("[ttc-arrivals] failed to load predictions", error);
		return {
			stopTitle: "",
			arrivals: [],
			updatedAt,
			error: error instanceof Error ? error.message : "Could not load TTC data",
		};
	}
}
