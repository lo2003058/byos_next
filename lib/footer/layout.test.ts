/// <reference types="jest" />

import sharp from "sharp";
import { composeWithFooter } from "./compose";
import { footerHeight } from "./layout";

describe("footerHeight", () => {
	it("is 34px on a 800x480 OG screen", () => {
		expect(footerHeight(800, 480)).toBe(34);
	});

	it("scales up on a larger screen", () => {
		expect(footerHeight(1872, 1404)).toBeGreaterThan(34);
	});

	it("never goes below a readable minimum", () => {
		expect(footerHeight(200, 120)).toBeGreaterThanOrEqual(26);
	});
});

describe("composeWithFooter", () => {
	const solid = (width: number, height: number, grey: number) =>
		sharp({
			create: {
				width,
				height,
				channels: 3,
				background: { r: grey, g: grey, b: grey },
			},
		})
			.png()
			.toBuffer();

	it("stacks the content above the footer on one canvas", async () => {
		const content = await solid(100, 60, 255);
		const footer = await solid(100, 20, 0);
		const out = await composeWithFooter({
			content,
			footer,
			width: 100,
			height: 80,
			footerHeight: 20,
		});
		const { data, info } = await sharp(out)
			.greyscale()
			.raw()
			.toBuffer({ resolveWithObject: true });
		expect(info.width).toBe(100);
		expect(info.height).toBe(80);
		expect(data[10 * 100 + 50]).toBe(255); // inside the content
		expect(data[70 * 100 + 50]).toBe(0); // inside the footer
	});
});
