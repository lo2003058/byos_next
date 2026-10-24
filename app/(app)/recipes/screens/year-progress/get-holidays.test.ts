/// <reference types="jest" />
import { getPublicHolidays } from "./get-holidays";

const yearOf = (url: string) =>
	Number(url.match(/PublicHolidays\/(\d{4})\//)?.[1]);

const feed: Record<number, unknown> = {
	2026: [
		{ date: "2026-12-25", name: "Christmas Day", counties: null },
		{ date: "2026-12-26", name: "St. Stephen's Day", counties: ["CA-ON"] },
		{ date: "2026-02-16", name: "Family Day", counties: ["CA-ON"] },
	],
	2027: [
		{ date: "2027-01-01", name: "New Year's Day", counties: null },
		{ date: "2027-02-15", name: "Family Day", counties: ["CA-ON"] },
	],
};

describe("getPublicHolidays", () => {
	const now = Date.UTC(2026, 9, 24, 15, 30);
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it("reads this year and next so the list wraps past December", async () => {
		const fetchMock = jest.fn(async (url: string) => ({
			ok: true,
			json: async () => feed[yearOf(url)] ?? [],
		}));
		global.fetch = fetchMock as unknown as typeof fetch;

		const data = await getPublicHolidays(
			{ province: "on" },
			{ deviceTimezone: "America/Toronto" },
			now,
		);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(data.province).toBe("ON");
		expect(data.today).toBe("2026-10-24");
		expect(data.error).toBe("");
		expect(data.holidays.map((h) => h.name)).toEqual([
			"Christmas Day",
			"Boxing Day",
			"New Year's Day",
			"Family Day",
		]);
	});

	it("falls back to Toronto's date and the default province without a device", async () => {
		global.fetch = jest.fn(async () => ({
			ok: true,
			json: async () => [],
		})) as unknown as typeof fetch;
		const data = await getPublicHolidays({ province: "??" }, undefined, now);
		expect(data.province).toBe("ON");
		expect(data.today).toBe("2026-10-24");
	});

	it("reports an error instead of throwing when the feed is down", async () => {
		global.fetch = jest.fn(async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;
		const data = await getPublicHolidays({ province: "ON" }, undefined, now);
		expect(data.holidays).toEqual([]);
		expect(data.error).toMatch(/holiday/i);
	});

	it("reports an error when the feed answers with a failure status", async () => {
		global.fetch = jest.fn(async () => ({
			ok: false,
			status: 500,
			json: async () => ({}),
		})) as unknown as typeof fetch;
		const data = await getPublicHolidays({ province: "ON" }, undefined, now);
		expect(data.error).not.toBe("");
	});
});
