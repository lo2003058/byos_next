/// <reference types="jest" />
import {
	annualDeductions,
	PROVINCE_OPTIONS,
	takeHomeShare,
	taxYearData,
} from "./canada-tax";

// Expected figures come from an independent reference calculation of the
// 2026 federal, provincial and CPP/QPP/EI/QPIP rules.
const close = (actual: number, expected: number) =>
	expect(actual).toBeCloseTo(expected, 0);

describe("annualDeductions 2026", () => {
	it("Ontario, $60,000", () => {
		const d = annualDeductions(60000, "ON", 2026);
		close(d.cpp, 3361.75);
		close(d.ei, 978);
		close(d.incomeTax, 5338.3 + 2982.2);
		close(d.total, 12660.25);
	});

	it("Ontario, $120,000 hits the CPP, CPP2 and EI maximums", () => {
		const d = annualDeductions(120000, "ON", 2026);
		close(d.cpp, 4230.45 + 416);
		close(d.ei, 1123.07);
		close(d.total, 32657.23);
	});

	it("Ontario low income: no federal tax, a little provincial tax", () => {
		const d = annualDeductions(15000, "ON", 2026);
		close(d.total, 983.4);
	});

	it("British Columbia, $80,000", () => {
		close(annualDeductions(80000, "BC", 2026).total, 18667.51);
	});

	it("Quebec, $80,000 uses QPP, Quebec EI and QPIP", () => {
		const d = annualDeductions(80000, "QC", 2026);
		close(d.cpp, 4479.3 + 216);
		close(d.ei, 895.7 + 344);
		close(d.total, 22496.7);
	});

	it("is zero for no income", () => {
		expect(annualDeductions(0, "ON", 2026).total).toBe(0);
	});
});

describe("takeHomeShare", () => {
	it("is the share of gross left after deductions", () => {
		close(takeHomeShare(60000, "ON", 2026) * 60000, 47339.75);
	});

	it("is 1 for no income", () => {
		expect(takeHomeShare(0, "ON", 2026)).toBe(1);
	});

	it("takes home less as pay goes up", () => {
		expect(takeHomeShare(200000, "ON", 2026)).toBeLessThan(
			takeHomeShare(60000, "ON", 2026),
		);
	});

	it("takes home less in Quebec than Alberta at the same pay", () => {
		expect(takeHomeShare(80000, "QC", 2026)).toBeLessThan(
			takeHomeShare(80000, "AB", 2026),
		);
	});
});

describe("taxYearData", () => {
	it("returns the table for a known year", () => {
		expect(taxYearData(2026).year).toBe(2026);
	});

	it("falls back to the latest table for a later year", () => {
		expect(taxYearData(2031).year).toBe(2026);
	});

	it("falls back to the earliest table for an earlier year", () => {
		expect(taxYearData(2019).year).toBe(2026);
	});
});

describe("PROVINCE_OPTIONS", () => {
	it("lists all 13 provinces and territories with codes that compute", () => {
		expect(PROVINCE_OPTIONS).toHaveLength(13);
		for (const option of PROVINCE_OPTIONS) {
			const d = annualDeductions(70000, option.value, 2026);
			expect(d.total).toBeGreaterThan(0);
			expect(d.total).toBeLessThan(70000);
		}
	});
});
