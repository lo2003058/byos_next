/// <reference types="jest" />
import { updatedLabel } from "./updated-label";

describe("updatedLabel", () => {
	it("keeps only the clock time from a date and time", () => {
		expect(updatedLabel("Oct 24, 15:30")).toBe("Updated 15:30");
	});

	it("accepts a bare time", () => {
		expect(updatedLabel("07:05")).toBe("Updated 07:05");
	});

	it("returns an empty string when there is no clock time", () => {
		expect(updatedLabel("N/A")).toBe("");
		expect(updatedLabel("Loading...")).toBe("");
		expect(updatedLabel("")).toBe("");
	});
});
