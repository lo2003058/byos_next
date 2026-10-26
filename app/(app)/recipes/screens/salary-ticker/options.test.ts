/// <reference types="jest" />
import { currencySymbol, TIME_OPTIONS } from "./options";

describe("currencySymbol", () => {
	it("maps a code to its symbol", () => {
		expect(currencySymbol("CAD")).toBe("$");
		expect(currencySymbol("HKD")).toBe("HK$");
	});

	it("falls back to $ for an unknown code", () => {
		expect(currencySymbol("XXX")).toBe("$");
	});
});

describe("TIME_OPTIONS", () => {
	it("covers the day in half hours", () => {
		expect(TIME_OPTIONS).toHaveLength(48);
		expect(TIME_OPTIONS[0]?.value).toBe("00:00");
		expect(TIME_OPTIONS[19]?.value).toBe("09:30");
		expect(TIME_OPTIONS[47]?.value).toBe("23:30");
	});
});
