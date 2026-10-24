/// <reference types="jest" />
import { fetchTtcPredictions, parseTtcPredictions } from "./predictions";

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

	it("throws on a non-OK response", async () => {
		const fetchImpl = jest.fn(async () => new Response("err", { status: 503 }));

		await expect(
			fetchTtcPredictions("8126", {
				fetchImpl: fetchImpl as unknown as typeof fetch,
			}),
		).rejects.toThrow("503");
	});
});
