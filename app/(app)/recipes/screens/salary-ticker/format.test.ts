/// <reference types="jest" />
import { formatMoney } from "./format";

describe("formatMoney", () => {
	it("rounds to whole units with thousands separators", () => {
		expect(formatMoney(12345.6, "$")).toBe("$12,346");
		expect(formatMoney(0, "HK$")).toBe("HK$0");
	});
});
