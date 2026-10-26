/// <reference types="jest" />
import { afterTax, formatMoney } from "./format";

describe("formatMoney", () => {
	it("rounds to whole units with thousands separators", () => {
		expect(formatMoney(12345.6, "$")).toBe("$12,346");
		expect(formatMoney(0, "HK$")).toBe("HK$0");
	});
});

describe("afterTax", () => {
	it("takes the tax rate off", () => {
		expect(afterTax(1000, 10)).toBe(900);
		expect(afterTax(333.33, 15)).toBe(283.33);
	});

	it("clamps nonsense rates", () => {
		expect(afterTax(1000, -5)).toBe(1000);
		expect(afterTax(1000, 150)).toBe(0);
	});
});
