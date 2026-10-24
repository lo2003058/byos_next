/// <reference types="jest" />
import { withAccessToken } from "./access-token-url";

describe("withAccessToken", () => {
	it("appends the token to a URL that already has a query", () => {
		expect(
			withAccessToken("https://x.test/api/bitmap/weather.png?width=800", "k 1"),
		).toBe(
			"https://x.test/api/bitmap/weather.png?width=800&access_token=k%201",
		);
	});

	it("starts a query when there is none", () => {
		expect(withAccessToken("https://x.test/a.png", "k")).toBe(
			"https://x.test/a.png?access_token=k",
		);
	});

	it("leaves a URL that already carries a token unchanged", () => {
		const url = "https://x.test/a.png?width=1&access_token=old";
		expect(withAccessToken(url, "new")).toBe(url);
	});
});
