/// <reference types="jest" />
import { planFooter } from "./plan";

const now = Date.UTC(2026, 9, 24, 15, 30);
const on = {
	enabled: true,
	text: "Yin's board",
	dateFormat: "short",
	batteryFormat: "percent",
} as const;
const ctx = {
	now,
	timezone: "America/Toronto",
	voltage: 3.9,
	width: 800,
	height: 480,
};

describe("planFooter", () => {
	it("returns the strip size and parts when the footer is on", () => {
		expect(planFooter(on, ctx)).toEqual({
			parts: {
				left: "Oct 24",
				center: "Yin's board",
				right: "50%",
				batteryLevel: 50,
				charging: false,
			},
			footerHeight: 34,
			contentHeight: 446,
		});
	});

	it("returns null when the footer is off", () => {
		expect(planFooter({ ...on, enabled: false }, ctx)).toBeNull();
	});

	it("returns null when there is nothing to show", () => {
		expect(
			planFooter(
				{ ...on, text: "", dateFormat: "none", batteryFormat: "none" },
				ctx,
			),
		).toBeNull();
	});

	it("still draws when only one part has content", () => {
		const plan = planFooter(
			{ ...on, dateFormat: "none", batteryFormat: "none" },
			ctx,
		);
		expect(plan?.parts).toEqual({
			left: "",
			center: "Yin's board",
			right: "",
			batteryLevel: null,
			charging: false,
		});
	});

	it("skips the footer on a canvas too small to hold it", () => {
		expect(planFooter(on, { ...ctx, height: 60 })).toBeNull();
	});
});
