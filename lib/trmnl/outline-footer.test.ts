/// <reference types="jest" />
import { outlineFooterStyle } from "./outline-footer";

describe("outlineFooterStyle", () => {
	it("draws the footer as a bordered white box, not a filled one", () => {
		const style = outlineFooterStyle();
		expect(style.backgroundColor).toBe("#fff");
		expect(style.color).toBe("#000");
		expect(style.borderStyle).toBe("solid");
		expect(style.borderColor).toBe("#000");
		expect(style.borderWidth).toBe(2);
	});

	it("accepts a custom border width", () => {
		expect(outlineFooterStyle(3).borderWidth).toBe(3);
	});
});
