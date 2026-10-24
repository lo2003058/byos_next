/// <reference types="jest" />
import {
	mixupScreenId,
	parseScreenRef,
	playlistImageTarget,
} from "./screen-ref";

describe("parseScreenRef", () => {
	it("treats a plain value as a recipe slug", () => {
		expect(parseScreenRef("weather-yin")).toEqual({
			kind: "recipe",
			slug: "weather-yin",
		});
	});

	it("reads mixup/<id> as a mixup", () => {
		expect(
			parseScreenRef("mixup/0d546dc7-8414-4b6d-87fc-93a54b382b49"),
		).toEqual({ kind: "mixup", id: "0d546dc7-8414-4b6d-87fc-93a54b382b49" });
	});

	it("does not treat a bare 'mixup/' or other nested paths as a mixup", () => {
		expect(parseScreenRef("mixup/")).toEqual({
			kind: "recipe",
			slug: "mixup/",
		});
		expect(parseScreenRef("mixups/abc")).toEqual({
			kind: "recipe",
			slug: "mixups/abc",
		});
		expect(parseScreenRef("mixup/a/b")).toEqual({
			kind: "recipe",
			slug: "mixup/a/b",
		});
	});
});

describe("mixupScreenId", () => {
	it("builds the stored value and round-trips through parseScreenRef", () => {
		const stored = mixupScreenId("abc-123");
		expect(stored).toBe("mixup/abc-123");
		expect(parseScreenRef(stored)).toEqual({ kind: "mixup", id: "abc-123" });
	});
});

describe("playlistImageTarget", () => {
	it("keeps the query untouched for a recipe", () => {
		expect(
			playlistImageTarget("weather-yin", "key", "width=800&height=480"),
		).toEqual({ imagePath: "weather-yin", query: "width=800&height=480" });
	});

	it("adds the device access token for a mixup so the image fetch is authorised", () => {
		expect(
			playlistImageTarget("mixup/m1", "a b&c", "width=800&height=480"),
		).toEqual({
			imagePath: "mixup/m1",
			query: "width=800&height=480&access_token=a%20b%26c",
		});
	});
});
