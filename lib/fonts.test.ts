/// <reference types="jest" />
jest.mock("next/font/google", () => ({
	Geist: () => ({ variable: "" }),
	Geist_Mono: () => ({ variable: "" }),
}));
jest.mock("next/font/local", () => ({
	__esModule: true,
	default: () => ({ variable: "" }),
}));

import fs from "fs";
import path from "path";
import { loadFont } from "./fonts";

describe("loadFont", () => {
	it("ships a real bold Inter so bold text is not synthesized", () => {
		const boldPath = path.join(
			process.cwd(),
			"public",
			"fonts",
			"Inter-Bold.ttf",
		);
		expect(fs.existsSync(boldPath)).toBe(true);
		const fonts = loadFont();
		expect(fonts?.interBold).toBeInstanceOf(Buffer);
		expect(fonts?.interBold.length).toBeGreaterThan(100_000);
	});

	it("ships a monochrome emoji font with the crying face", () => {
		const fonts = loadFont();
		expect(fonts?.notoEmoji).toBeInstanceOf(Buffer);
		expect(fonts?.notoEmoji.length).toBeGreaterThan(1_000);
	});
});
