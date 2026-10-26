/// <reference types="jest" />
import { formatMoney, formatRate } from "./format";

describe("formatMoney", () => {
	it("rounds to whole units with thousands separators", () => {
		expect(formatMoney(12345.6, "$")).toBe("$12,346");
		expect(formatMoney(0, "HK$")).toBe("HK$0");
	});
});

describe("formatRate", () => {
	it("keeps more decimals for small rates", () => {
		expect(formatRate(0.00789, "$")).toBe("$0.0079");
		expect(formatRate(0.4735, "$")).toBe("$0.47");
		expect(formatRate(28.4087, "$")).toBe("$28.41");
		expect(formatRate(125.4, "$")).toBe("$125");
	});
});
