/// <reference types="jest" />
import { normalizeRefreshSchedule, parseRefreshSeconds } from "./defaults";

describe("parseRefreshSeconds", () => {
	it("reads numbers and numeric strings", () => {
		expect(parseRefreshSeconds(600)).toBe(600);
		expect(parseRefreshSeconds("600")).toBe(600);
		expect(parseRefreshSeconds(" 45 ")).toBe(45);
	});

	it("rounds to whole seconds", () => {
		expect(parseRefreshSeconds("12.6")).toBe(13);
	});

	it("rejects blanks, text, zero and negatives", () => {
		for (const bad of ["", "abc", 0, "0", -5, "-5", null, undefined, NaN]) {
			expect(parseRefreshSeconds(bad)).toBeNull();
		}
	});
});

describe("normalizeRefreshSchedule", () => {
	it("keeps a rate that was saved as a string from the form", () => {
		expect(
			normalizeRefreshSchedule(
				JSON.stringify({
					default_refresh_rate: "900",
					time_ranges: [
						{ start_time: "00:00", end_time: "07:00", refresh_rate: "3600" },
					],
				}),
			),
		).toEqual({
			default_refresh_rate: 900,
			time_ranges: [
				{ start_time: "00:00", end_time: "07:00", refresh_rate: 3600 },
			],
		});
	});

	it("still reads a normal numeric schedule", () => {
		expect(
			normalizeRefreshSchedule({ default_refresh_rate: 60, time_ranges: [] }),
		).toEqual({ default_refresh_rate: 60, time_ranges: [] });
	});

	it("returns null when the default rate is unusable", () => {
		expect(normalizeRefreshSchedule({ default_refresh_rate: "" })).toBeNull();
		expect(normalizeRefreshSchedule({ default_refresh_rate: "x" })).toBeNull();
		expect(normalizeRefreshSchedule(null)).toBeNull();
	});

	it("drops time ranges with an unusable rate", () => {
		const result = normalizeRefreshSchedule({
			default_refresh_rate: 60,
			time_ranges: [
				{ start_time: "00:00", end_time: "07:00", refresh_rate: "" },
			],
		});
		expect(result?.time_ranges).toEqual([]);
	});
});
