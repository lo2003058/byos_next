/**
 * TTC arrival predictions from the public UmoIQ (ex-NextBus) feed.
 *
 * Covers buses and streetcars by stop code. The feed is XML-to-JSON, so any
 * field that can repeat is a single object when there is one result and an
 * array when there are several; everything is normalised here.
 */

const FEED_URL = "https://webservices.umoiq.com/service/publicJSONFeed";
const FETCH_TIMEOUT_MS = 10_000;

export type TtcArrival = {
	route: string;
	routeTitle: string;
	destination: string;
	minutes: number;
	seconds: number;
};

export type TtcPredictions = {
	stopTitle: string;
	arrivals: TtcArrival[];
};

export type ParseOptions = {
	/** Keep only these route tags (e.g. "510"). Empty or omitted keeps all. */
	routes?: readonly string[];
	/** Maximum arrivals returned. */
	limit?: number;
};

type Dict = Record<string, unknown>;

const isDict = (value: unknown): value is Dict =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const toArray = (value: unknown): unknown[] => {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
};

const asString = (value: unknown): string =>
	typeof value === "string" ? value : "";

/** "South - 510 Spadina towards Union Station" -> "Union Station". */
function destinationFrom(directionTitle: string): string {
	const match = directionTitle.match(/\btowards\s+(.+)$/i);
	return (match?.[1] ?? directionTitle).trim();
}

function parseArrival(
	routeTag: string,
	routeTitle: string,
	directionTitle: string,
	raw: unknown,
): TtcArrival | null {
	if (!isDict(raw)) return null;
	const seconds = Number(raw.seconds);
	if (!Number.isFinite(seconds) || seconds < 0) return null;
	return {
		route: routeTag,
		routeTitle,
		destination: destinationFrom(directionTitle),
		minutes: Math.floor(seconds / 60),
		seconds,
	};
}

export function parseTtcPredictions(
	payload: unknown,
	options: ParseOptions = {},
): TtcPredictions {
	if (!isDict(payload)) {
		throw new Error("TTC feed returned an unexpected response");
	}
	if (isDict(payload.Error)) {
		throw new Error(
			asString(payload.Error.content) || "TTC feed returned an error",
		);
	}

	const wantedRoutes = new Set(options.routes ?? []);
	let stopTitle = "";
	const arrivals: TtcArrival[] = [];

	for (const entry of toArray(payload.predictions)) {
		if (!isDict(entry)) continue;
		const routeTag = asString(entry.routeTag);
		stopTitle ||= asString(entry.stopTitle);
		if (wantedRoutes.size > 0 && !wantedRoutes.has(routeTag)) continue;

		const routeTitle = asString(entry.routeTitle);
		for (const direction of toArray(entry.direction)) {
			if (!isDict(direction)) continue;
			const directionTitle = asString(direction.title);
			for (const raw of toArray(direction.prediction)) {
				const arrival = parseArrival(routeTag, routeTitle, directionTitle, raw);
				if (arrival) arrivals.push(arrival);
			}
		}
	}

	const sorted = [...arrivals].sort((a, b) => a.seconds - b.seconds);
	return {
		stopTitle,
		arrivals: options.limit ? sorted.slice(0, options.limit) : sorted,
	};
}

export async function fetchTtcPredictions(
	stopId: string,
	options: ParseOptions & { fetchImpl?: typeof fetch } = {},
): Promise<TtcPredictions> {
	const stop = stopId.trim();
	if (!stop) {
		throw new Error("A TTC stop code is required");
	}

	const { fetchImpl = fetch, ...parseOptions } = options;
	const url = `${FEED_URL}?command=predictions&a=ttc&stopId=${encodeURIComponent(stop)}`;
	const response = await fetchImpl(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(`TTC feed responded with status ${response.status}`);
	}
	return parseTtcPredictions(await response.json(), parseOptions);
}

export type TtcStopSection = TtcPredictions & {
	stopId: string;
	/** Empty when the stop loaded; otherwise why it did not. */
	error: string;
};

/**
 * Load several stops in parallel. One stop failing must not blank the others,
 * so failures are returned on that section instead of thrown.
 */
export async function fetchTtcSections(
	stopIds: readonly string[],
	options: ParseOptions & { fetchImpl?: typeof fetch } = {},
): Promise<TtcStopSection[]> {
	const unique = [
		...new Set(stopIds.map((stop) => stop.trim()).filter(Boolean)),
	];

	return Promise.all(
		unique.map(async (stopId): Promise<TtcStopSection> => {
			try {
				const result = await fetchTtcPredictions(stopId, options);
				return { stopId, ...result, error: "" };
			} catch (error) {
				return {
					stopId,
					stopTitle: "",
					arrivals: [],
					error:
						error instanceof Error ? error.message : "Could not load TTC data",
				};
			}
		}),
	);
}
