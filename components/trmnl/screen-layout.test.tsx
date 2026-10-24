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

	it("centers the icon+text group but keeps the text left-aligned", () => {
		const out = render("center");
		// The row holding icon and text is centered in the tile...
		expect(out).toContain("justify-content:center");
		// ...while the text itself is not centered inside the group.
		expect(out).not.toContain("text-align:center");
	});

	it("lays the group out from the start by default", () => {
		const row = (out: string) =>
			out.match(/flex-direction:row;align-items:center;[^"]*/g) ?? [];
		expect(
			row(render("center")).some((s) => s.includes("justify-content:center")),
		).toBe(true);
		expect(
			row(render()).some((s) => s.includes("justify-content:center")),
		).toBe(false);
	});
});
