/// <reference types="jest" />
import { renderToStaticMarkup } from "react-dom/server";
import { createScreenProfile } from "@/lib/trmnl/screen-profile";
import { GlobalFooter } from "./global-footer";

const screen = createScreenProfile({ width: 800, height: 480 });

describe("GlobalFooter", () => {
	it("renders the three parts in order: left, center, right", () => {
		const out = renderToStaticMarkup(
			<GlobalFooter
				parts={{ left: "Oct 24", center: "Yin's board", right: "50%" }}
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
				parts={{ left: "", center: "Hi", right: "" }}
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
				parts={{ left: "a", center: "b", right: "c" }}
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
				parts={{ left: "a", center: "b", right: "c" }}
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
});
