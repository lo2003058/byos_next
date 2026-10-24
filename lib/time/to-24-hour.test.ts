/// <reference types="jest" />
import { to24Hour } from "./to-24-hour";

describe("to24Hour", () => {
	it("converts a 12-hour clock to 24-hour with zero padding", () => {
		expect(to24Hour("07:43 AM")).toBe("07:43");
		expect(to24Hour("06:19 PM")).toBe("18:19");
		expect(to24Hour("7:05 am")).toBe("07:05");
	});

	it("handles midnight and noon", () => {
		expect(to24Hour("12:00 AM")).toBe("00:00");
		expect(to24Hour("12:30 PM")).toBe("12:30");
	});

	it("converts a time inside a longer string and leaves the rest alone", () => {
		expect(to24Hour("Oct 24, 02:00 PM")).toBe("Oct 24, 14:00");
		expect(to24Hour("Toronto, Canada · Oct 24, 09:15 AM")).toBe(
			"Toronto, Canada · Oct 24, 09:15",
		);
	});

	it("accepts a narrow no-break space before the meridiem", () => {
		expect(to24Hour("02:00 PM")).toBe("14:00");
	});

	it("returns text without a 12-hour time unchanged", () => {
		expect(to24Hour("N/A")).toBe("N/A");
		expect(to24Hour("")).toBe("");
		expect(to24Hour("13:45")).toBe("13:45");
	});
});
