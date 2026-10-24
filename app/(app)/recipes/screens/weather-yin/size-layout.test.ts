/// <reference types="jest" />
import { weatherLayout } from "./size-layout";

const at = (logicalWidth: number, logicalHeight: number) =>
	weatherLayout({ logicalWidth, logicalHeight });

describe("weatherLayout", () => {
	it("uses the full layout on a whole OG screen", () => {
		expect(at(800, 480)).toMatchObject({ kind: "full", maxStats: 8 });
	});

	it("uses the half layout for a vertical half", () => {
		expect(at(400, 480)).toMatchObject({ kind: "half", maxStats: 8 });
	});

	it("uses the banner layout for a wide, short slot", () => {
		expect(at(800, 240)).toMatchObject({ kind: "banner", maxStats: 8 });
	});

	it("uses the quarter layout for a small slot and keeps only the first stats", () => {
		expect(at(400, 240)).toMatchObject({ kind: "quarter", maxStats: 2 });
	});

	it("treats a tall narrow slot as a half, not a banner", () => {
		expect(at(300, 480).kind).toBe("half");
	});

	it("treats a short slot just over the limit as full", () => {
		expect(at(800, 320).kind).toBe("full");
	});
});
