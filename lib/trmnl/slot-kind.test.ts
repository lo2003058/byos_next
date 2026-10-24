/// <reference types="jest" />
import { slotKind } from "./slot-kind";

const at = (logicalWidth: number, logicalHeight: number) =>
	slotKind({ logicalWidth, logicalHeight });

describe("slotKind", () => {
	it("classifies the mixup slot sizes", () => {
		expect(at(800, 480)).toBe("full");
		expect(at(800, 446)).toBe("full");
		expect(at(400, 480)).toBe("half");
		expect(at(400, 446)).toBe("half");
		expect(at(800, 240)).toBe("banner");
		expect(at(800, 206)).toBe("banner");
		expect(at(400, 240)).toBe("quarter");
		expect(at(400, 206)).toBe("quarter");
	});

	it("treats a short slot just over the limit as full", () => {
		expect(at(800, 320)).toBe("full");
	});
});
