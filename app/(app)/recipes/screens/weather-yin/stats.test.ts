/// <reference types="jest" />
import { gridColumns, selectStats } from "./stats";

const items = [
	{ key: "feelsLike", label: "Feels Like" },
	{ key: "humidity", label: "Humidity" },
	{ key: "wind", label: "Wind Speed" },
] as const;

describe("selectStats", () => {
	it("keeps only the stats whose flag is on, in the original order", () => {
		const flags = { feelsLike: true, humidity: false, wind: true };
		expect(selectStats([...items], flags).map((item) => item.key)).toEqual([
			"feelsLike",
			"wind",
		]);
	});

	it("treats a missing flag as shown", () => {
		expect(selectStats([...items], {}).length).toBe(3);
	});

	it("returns nothing when every flag is off", () => {
		const flags = { feelsLike: false, humidity: false, wind: false };
		expect(selectStats([...items], flags)).toEqual([]);
	});
});

describe("gridColumns", () => {
	it("uses 2 columns on half screens", () => {
		expect(gridColumns(6, true)).toBe(2);
	});

	it("uses 4 columns for 7 or 8 stats so they fit in two rows", () => {
		expect(gridColumns(8, false)).toBe(4);
		expect(gridColumns(7, false)).toBe(4);
	});

	it("uses 3 columns for 5 or 6 stats and 2 for 4 or fewer", () => {
		expect(gridColumns(6, false)).toBe(3);
		expect(gridColumns(5, false)).toBe(3);
		expect(gridColumns(4, false)).toBe(2);
		expect(gridColumns(3, false)).toBe(3);
		expect(gridColumns(2, false)).toBe(2);
		expect(gridColumns(1, false)).toBe(1);
	});
});
