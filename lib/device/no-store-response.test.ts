/// <reference types="jest" />
import { withNoStore } from "./no-store-response";

describe("withNoStore", () => {
	it("marks the response as uncacheable so CDNs do not serve a stale screen", () => {
		const original = new Response("png", {
			status: 200,
			headers: { "Content-Type": "image/png", "Content-Length": "3" },
		});

		const result = withNoStore(original);

		expect(result.headers.get("Cache-Control")).toBe("no-store");
	});

	it("keeps status, body and existing headers", async () => {
		const original = new Response("png-bytes", {
			status: 500,
			headers: {
				"Content-Type": "image/png",
				"X-TRMNL-Image-Size-Limit-Exceeded": "true",
			},
		});

		const result = withNoStore(original);

		expect(result.status).toBe(500);
		expect(result.headers.get("Content-Type")).toBe("image/png");
		expect(result.headers.get("X-TRMNL-Image-Size-Limit-Exceeded")).toBe(
			"true",
		);
		expect(await result.text()).toBe("png-bytes");
	});

	it("does not mutate the original response", () => {
		const original = new Response("png", {
			headers: { "Content-Type": "image/png" },
		});

		withNoStore(original);

		expect(original.headers.get("Cache-Control")).toBeNull();
	});
});
