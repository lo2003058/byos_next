/// <reference types="jest" />
import { renderToStaticMarkup } from "react-dom/server";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import { StatsGrid, screenCanvasPadding, screenMetric } from "./screen-layout";

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

describe("StatsGrid alignment", () => {
	const screen = createScreenProfile({ width: 800, height: 480 });
	const stats = [{ label: "Humidity", value: "68%", icon: <span>i</span> }];
	const render = (align?: "start" | "center") =>
		renderToStaticMarkup(
			<StatsGrid screen={screen} stats={stats} columns={1} align={align} />,
		);

	it("centers tile content when asked", () => {
		const out = render("center");
		expect(out).toContain("justify-content:center");
		expect(out).toContain("align-items:center");
		expect(out).toContain("text-align:center");
	});

	it("keeps the left-aligned look by default", () => {
		expect(render()).not.toContain("text-align:center");
	});
});
