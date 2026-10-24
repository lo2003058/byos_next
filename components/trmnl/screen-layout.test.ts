/// <reference types="jest" />
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import { screenCanvasPadding, screenMetric } from "./screen-layout";

describe("screenCanvasPadding", () => {
	it("uses the compact padding on a half screen", () => {
		const screen = createScreenProfile({ width: 400, height: 480 });
		expect(screen.isCompact).toBe(true);
		expect(screenCanvasPadding(screen)).toBe(screenMetric(screen, 12));
	});

	it("uses the regular padding on a full OG screen", () => {
		const screen = createScreenProfile({ width: 800, height: 480 });
		expect(screen.isCompact).toBe(false);
		expect(screenCanvasPadding(screen)).toBe(screenMetric(screen, 18));
	});
});
