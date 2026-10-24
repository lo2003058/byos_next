/// <reference types="jest" />
import { redactAccessToken, withAccessToken } from "./access-token-url";

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

describe("redactAccessToken", () => {
	it("hides the token value but keeps the rest of the URL for debugging", () => {
		expect(
			redactAccessToken(
				"https://x.test/api/bitmap/mixup/m1.png?width=800&access_token=SECRET123&model=og",
			),
		).toBe(
			"https://x.test/api/bitmap/mixup/m1.png?width=800&access_token=%5Bredacted%5D&model=og",
		);
	});

	it("redacts a token at the start or end of the query", () => {
		expect(redactAccessToken("https://x.test/a.png?access_token=ab")).toBe(
			"https://x.test/a.png?access_token=%5Bredacted%5D",
		);
		expect(
			redactAccessToken("https://x.test/a.png?w=1&access_token=a%20b%26c"),
		).not.toContain("a%20b");
	});

	it("leaves a URL without a token unchanged", () => {
		const url = "https://x.test/a.png?width=800";
		expect(redactAccessToken(url)).toBe(url);
	});

	it("never throws on text that is not a URL", () => {
		expect(redactAccessToken("not a url access_token=SECRET")).not.toContain(
			"SECRET",
		);
	});
});
