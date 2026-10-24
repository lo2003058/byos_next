import { formatClock } from "@/lib/ttc/format";
import { fetchTtcSections, type TtcArrival } from "@/lib/ttc/predictions";

export type TtcArrivalsParams = {
	stopIds: string;
	labels: string;
	routes: string;
	limit: number;
	perRoute: number;
	timezone: string;
};

export type TtcArrivalView = TtcArrival & {
	/** Predicted clock time, e.g. "8:07 AM" (empty if unknown). */
	arrivesAt: string;
};

export type TtcArrivalsSection = {
	label: string;
	arrivals: TtcArrivalView[];
	error: string;
};

export type TtcArrivalsData = {
	sections: TtcArrivalsSection[];
	updatedAt: string;
};

const splitList = (value: string): string[] =>
	value
		.split(",")
		.map((item) => item.trim())
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
 * returned on the section and drawn on screen instead.
 *
 * `labels` names the stops in order (e.g. "Eastbound, Westbound"); a stop
 * without a label falls back to the stop title from the feed.
 */
export default async function getData(
	params: TtcArrivalsParams,
): Promise<TtcArrivalsData> {
	const updatedAt = formatTime(params.timezone);
	const stopIds = splitList(params.stopIds);
	const labels = splitList(params.labels);

	const sections = await fetchTtcSections(stopIds, {
		routes: splitList(params.routes),
		limit: params.limit,
		perRouteLimit: params.perRoute,
	});
	const now = Date.now();

	return {
		updatedAt,
		sections: sections.map((section, index) => ({
			label: labels[index] || section.stopTitle || `Stop ${section.stopId}`,
			arrivals: section.arrivals.map((arrival) => ({
				...arrival,
				arrivesAt: formatClock(
					arrival.epochMs ?? now + arrival.seconds * 1000,
					params.timezone,
				),
			})),
			error: section.error,
		})),
	};
}
