/// <reference types="jest" />
import { renderToStaticMarkup } from "react-dom/server";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import { GlobalFooter } from "./global-footer";

const screen = createScreenProfile({ width: 800, height: 480 });

describe("GlobalFooter", () => {
	it("renders the three parts in order: left, center, right", () => {
		const out = renderToStaticMarkup(
			<GlobalFooter
				parts={{
					left: "Oct 24",
					center: "Yin's board",
					right: "50%",
					batteryLevel: null,
					charging: false,
				}}
				width={800}
				height={34}
				screen={screen}
			/>,
		);
		const l = out.indexOf(">Oct 24<");
		const c = out.indexOf(">Yin&#x27;s board<");
		const r = out.indexOf(">50%<");
		expect(l).toBeGreaterThan(-1);
		expect(c).toBeGreaterThan(l);
		expect(r).toBeGreaterThan(c);
	});

	it("keeps the layout when a part is empty", () => {
		const out = renderToStaticMarkup(
			<GlobalFooter
				parts={{
					left: "",
					center: "Hi",
					right: "",
					batteryLevel: null,
					charging: false,
				}}
				width={800}
				height={34}
				screen={screen}
			/>,
		);
		expect(out).toContain("Hi");
	});

	it("uses the strip height it is given", () => {
		const out = renderToStaticMarkup(
			<GlobalFooter
				parts={{
					left: "a",
					center: "b",
					right: "c",
					batteryLevel: null,
					charging: false,
				}}
				width={800}
				height={34}
				screen={screen}
			/>,
		);
		expect(out).toContain("height:34px");
		expect(out).toContain("width:800px");
	});

	it("is a flush bottom bar with only a top border", () => {
		const out = renderToStaticMarkup(
			<GlobalFooter
				parts={{
					left: "a",
					center: "b",
					right: "c",
					batteryLevel: null,
					charging: false,
				}}
				width={800}
				height={34}
				screen={screen}
			/>,
		);
		expect(out).toContain("border-top:2px solid #000");
		expect(out).not.toContain("border-radius");
		expect(out).not.toContain("border:2px");
		expect(out).not.toContain("border-bottom");
	});

	describe("icons", () => {
		const render = (parts: Partial<Record<string, unknown>>) =>
			renderToStaticMarkup(
				<GlobalFooter
					parts={{
						left: "24-Oct-2026",
						center: "",
						right: "50%",
						batteryLevel: 50,
						charging: false,
						...parts,
					}}
					width={800}
					height={34}
					screen={screen}
				/>,
			);

		it("draws a calendar icon before the date and a battery icon before the level", () => {
			const out = render({});
			expect(out).toContain('aria-label="Calendar"');
			expect(out).toContain('aria-label="Battery"');
			expect(out.indexOf('aria-label="Calendar"')).toBeLessThan(
				out.indexOf(">24-Oct-2026<"),
			);
			expect(out.indexOf('aria-label="Battery"')).toBeLessThan(
				out.indexOf(">50%<"),
			);
		});

		it("omits an icon when its text is empty", () => {
			const out = render({ left: "", right: "", batteryLevel: null });
			expect(out).not.toContain('aria-label="Calendar"');
			expect(out).not.toContain('aria-label="Battery"');
		});

		it("fills more battery segments at a higher level", () => {
			const segments = (level: number) =>
				(render({ batteryLevel: level }).match(/data-segment="on"/g) ?? [])
					.length;
			expect(segments(0)).toBe(0);
			expect(segments(50)).toBe(2);
			expect(segments(100)).toBe(4);
		});
	});
});
