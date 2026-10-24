/// <reference types="jest" />
import {
	fetchTtcPredictions,
	fetchTtcSections,
	parseTtcPredictions,
} from "./predictions";

const prediction = (seconds: number, extra: Record<string, string> = {}) => ({
	seconds: String(seconds),
	minutes: String(Math.floor(seconds / 60)),
	isDeparture: "false",
	vehicle: "4504",
	...extra,
});

const route = (
	routeTag: string,
	directionTitle: string,
	predictions: ReturnType<typeof prediction> | ReturnType<typeof prediction>[],
) => ({
	routeTag,
	routeTitle: `${routeTag}-Spadina`,
	stopTitle: "Spadina Ave At King St West",
	direction: { title: directionTitle, prediction: predictions },
});

describe("parseTtcPredictions", () => {
	it("returns arrivals sorted soonest first with the stop title", () => {
		const result = parseTtcPredictions({
			predictions: [
				route("310", "South - 310 Spadina towards Union Station", [
					prediction(1867),
					prediction(516),
				]),
				route("510", "South - 510 Spadina towards Union Station", [
					prediction(120),
				]),
			],
		});

		expect(result.stopTitle).toBe("Spadina Ave At King St West");
		expect(result.arrivals.map((a) => [a.route, a.minutes])).toEqual([
			["510", 2],
			["310", 8],
			["310", 31],
		]);
		expect(result.arrivals[0].destination).toBe("Union Station");
	});

	it("accepts the single-object forms the feed uses for one result", () => {
		const result = parseTtcPredictions({
			predictions: route(
				"510",
				"South - 510 Spadina towards Union",
				prediction(60),
			),
		});

		expect(result.arrivals).toHaveLength(1);
		expect(result.arrivals[0]).toMatchObject({ route: "510", minutes: 1 });
	});

	it("flattens multiple directions on one route", () => {
		const result = parseTtcPredictions({
			predictions: {
				routeTag: "505",
				routeTitle: "505-Dundas",
				stopTitle: "Dundas At Bay",
				direction: [
					{
						title: "East - 505 Dundas towards Broadview",
						prediction: prediction(300),
					},
					{
						title: "West - 505 Dundas towards Dundas West",
						prediction: prediction(90),
					},
				],
			},
		});

		expect(result.arrivals.map((a) => a.destination)).toEqual([
			"Dundas West",
			"Broadview",
		]);
	});

	it("skips routes with no predictions but keeps the stop title", () => {
		const result = parseTtcPredictions({
			predictions: [
				{
					routeTag: "510",
					routeTitle: "510-Spadina",
					stopTitle: "Spadina Ave At King St West",
					dirTitleBecauseNoPredictions: "South - 510 Spadina towards Union",
				},
			],
		});

		expect(result.arrivals).toEqual([]);
		expect(result.stopTitle).toBe("Spadina Ave At King St West");
	});

	it("filters by route tag and limits the count", () => {
		const payload = {
			predictions: [
				route("310", "South - 310 Spadina towards Union", [
					prediction(60),
					prediction(120),
					prediction(180),
				]),
				route("510", "South - 510 Spadina towards Union", [prediction(30)]),
			],
		};

		const result = parseTtcPredictions(payload, { routes: ["310"], limit: 2 });

		expect(result.arrivals.map((a) => [a.route, a.minutes])).toEqual([
			["310", 1],
			["310", 2],
		]);
	});

	it("falls back to the direction title when it has no 'towards'", () => {
		const result = parseTtcPredictions({
			predictions: route("1", "Line 1 Northbound", prediction(60)),
		});

		expect(result.arrivals[0].destination).toBe("Line 1 Northbound");
	});

	it("throws the feed's message when the stop is invalid", () => {
		expect(() =>
			parseTtcPredictions({
				Error: { content: "stopId=14110 is not valid for agency=ttc" },
			}),
		).toThrow("stopId=14110 is not valid for agency=ttc");
	});

	it("ignores predictions with a non-numeric time", () => {
		const result = parseTtcPredictions({
			predictions: route("510", "South - 510 towards Union", [
				{ ...prediction(60), seconds: "soon" },
				prediction(120),
			]),
		});

		expect(result.arrivals.map((a) => a.minutes)).toEqual([2]);
	});

	it("rejects payloads that are not an object", () => {
		expect(() => parseTtcPredictions(null)).toThrow();
		expect(() => parseTtcPredictions("nope")).toThrow();
	});
});

describe("fetchTtcPredictions", () => {
	it("requests the stop and returns parsed arrivals", async () => {
		const fetchImpl = jest.fn(async () =>
			Response.json({
				predictions: route("510", "South - 510 towards Union", prediction(60)),
			}),
		);

		const result = await fetchTtcPredictions("8126", {
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		const url = String((fetchImpl.mock.calls[0] as unknown[])[0]);
		expect(url).toContain("command=predictions");
		expect(url).toContain("a=ttc");
		expect(url).toContain("stopId=8126");
		expect(result.arrivals).toHaveLength(1);
	});

	it("encodes the stop id and rejects an empty one", async () => {
		await expect(fetchTtcPredictions("  ")).rejects.toThrow(/stop/i);
	});

	it("refuses an oversized response instead of parsing it", async () => {
		const huge = JSON.stringify({ padding: "x".repeat(2_000_000) });
		const fetchImpl = jest.fn(async () => new Response(huge));

		await expect(
			fetchTtcPredictions("8126", {
				fetchImpl: fetchImpl as unknown as typeof fetch,
			}),
		).rejects.toThrow(/too large/i);
	});

	it("throws on a non-OK response", async () => {
		const fetchImpl = jest.fn(async () => new Response("err", { status: 503 }));

		await expect(
			fetchTtcPredictions("8126", {
				fetchImpl: fetchImpl as unknown as typeof fetch,
			}),
		).rejects.toThrow("503");
	});
});

describe("fetchTtcSections", () => {
	const stopPayload = (
		stopTitle: string,
		routeTag: string,
		seconds: number,
	) => ({
		predictions: {
			routeTag,
			routeTitle: `${routeTag}-Steeles`,
			stopTitle,
			direction: {
				title: `East - ${routeTag} Steeles towards Staines`,
				prediction: [{ seconds: String(seconds), minutes: "0" }],
			},
		},
	});

	const routedFetch =
		(byStop: Record<string, () => Response>) =>
		async (input: RequestInfo | URL) => {
			const stop = new URL(String(input)).searchParams.get("stopId") ?? "";
			const handler = byStop[stop];
			if (!handler) throw new Error(`unexpected stop ${stop}`);
			return handler();
		};

	it("returns one section per stop in the order given", async () => {
		const fetchImpl = routedFetch({
			"12816": () => Response.json(stopPayload("East Side", "53", 120)),
			"8215": () => Response.json(stopPayload("West Side", "953", 240)),
		});

		const sections = await fetchTtcSections(["12816", "8215"], {
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		expect(sections.map((s) => [s.stopId, s.stopTitle, s.error])).toEqual([
			["12816", "East Side", ""],
			["8215", "West Side", ""],
		]);
		expect(sections[1].arrivals[0].route).toBe("953");
	});

	it("applies the route filter and per-stop limit to every stop", async () => {
		const fetchImpl = routedFetch({
			"1": () =>
				Response.json({
					predictions: [
						stopPayload("A", "53", 60).predictions,
						stopPayload("A", "353", 30).predictions,
					],
				}),
		});

		const [section] = await fetchTtcSections(["1"], {
			routes: ["53", "953"],
			limit: 1,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		expect(section.arrivals.map((a) => a.route)).toEqual(["53"]);
	});

	it("keeps the other stops when one stop fails", async () => {
		const fetchImpl = routedFetch({
			"1": () => new Response("down", { status: 503 }),
			"2": () => Response.json(stopPayload("Ok Stop", "53", 60)),
		});

		const sections = await fetchTtcSections(["1", "2"], {
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		expect(sections[0].error).toContain("503");
		expect(sections[0].arrivals).toEqual([]);
		expect(sections[1].error).toBe("");
		expect(sections[1].arrivals).toHaveLength(1);
	});

	it("ignores blank and duplicate stop codes", async () => {
		const fetchImpl = jest.fn(async () =>
			Response.json(stopPayload("A", "53", 60)),
		);

		const sections = await fetchTtcSections(["8215", " ", "8215", ""], {
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		expect(sections).toHaveLength(1);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});
});

describe("parseTtcPredictions: clock time and express routes", () => {
	it("reads the arrival time from epochTime", () => {
		const result = parseTtcPredictions({
			predictions: route("53", "East - 53 Steeles East towards Staines", [
				prediction(300, { epochTime: "1792823000000" }),
			]),
		});

		expect(result.arrivals[0].epochMs).toBe(1792823000000);
	});

	it("leaves epochMs undefined when the feed omits it", () => {
		const result = parseTtcPredictions({
			predictions: route("53", "East - 53 towards Staines", prediction(300)),
		});

		expect(result.arrivals[0].epochMs).toBeUndefined();
	});

	it("flags routes whose title says Express", () => {
		const result = parseTtcPredictions({
			predictions: [
				{
					...route(
						"953",
						"East - 953 Steeles East Express towards Staines",
						prediction(60),
					),
					routeTitle: "953-Steeles East Express",
				},
				{
					...route(
						"53",
						"East - 53 Steeles East towards Staines",
						prediction(120),
					),
					routeTitle: "53-Steeles East",
				},
			],
		});

		expect(result.arrivals.map((a) => [a.route, a.express])).toEqual([
			["953", true],
			["53", false],
		]);
	});

	it("keeps the soonest N per route so a frequent route cannot hide an express", () => {
		const frequent = route("53", "East - 53 towards Staines", [
			prediction(60),
			prediction(120),
			prediction(180),
			prediction(240),
		]);
		const express = route("953", "East - 953 towards Staines", [
			prediction(900),
			prediction(1500),
		]);

		const result = parseTtcPredictions(
			{ predictions: [frequent, express] },
			{ perRouteLimit: 2 },
		);

		expect(result.arrivals.map((a) => [a.route, a.minutes])).toEqual([
			["53", 1],
			["53", 2],
			["953", 15],
			["953", 25],
		]);
	});

	it("still honours the overall limit after the per-route cut", () => {
		const result = parseTtcPredictions(
			{
				predictions: [
					route("53", "East - 53 towards Staines", [
						prediction(60),
						prediction(120),
					]),
					route("953", "East - 953 towards Staines", [
						prediction(180),
						prediction(240),
					]),
				],
			},
			{ perRouteLimit: 2, limit: 3 },
		);

		expect(result.arrivals).toHaveLength(3);
	});
});
