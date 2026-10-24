/// <reference types="jest" />
import { buildScreenOptions } from "./screen-options";

describe("buildScreenOptions", () => {
	const recipes = [
		{ slug: "weather-yin", name: "Weather (Outline)" },
		{ slug: "ttc-arrivals", name: "TTC Arrivals" },
	];
	const mixups = [{ id: "m1", name: "Weather & TTC" }];

	it("lists recipes first, then mixups under a mixup/<id> value", () => {
		expect(buildScreenOptions(recipes, mixups)).toEqual([
			{ slug: "weather-yin", name: "Weather (Outline)" },
			{ slug: "ttc-arrivals", name: "TTC Arrivals" },
			{ slug: "mixup/m1", name: "Mixup: Weather & TTC" },
		]);
	});

	it("works without mixups", () => {
		expect(buildScreenOptions(recipes, [])).toEqual(recipes);
	});

	it("does not mutate its inputs", () => {
		const copy = [...recipes];
		buildScreenOptions(recipes, mixups);
		expect(recipes).toEqual(copy);
	});
});
