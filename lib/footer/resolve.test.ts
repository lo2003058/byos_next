/// <reference types="jest" />
jest.mock("./device-footer", () => ({ loadDeviceFooter: jest.fn() }));
jest.mock("@/lib/logger", () => ({
	logError: jest.fn(),
	logInfo: jest.fn(),
	logWarn: jest.fn(),
}));

import { loadDeviceFooter } from "./device-footer";
import { resolveFooterPlan } from "./resolve";

const load = loadDeviceFooter as jest.Mock;
const size = { width: 800, height: 480 };
const now = Date.UTC(2026, 9, 24, 15, 30);
const context = (over = {}) => ({
	config: {
		enabled: true,
		text: "Hi",
		dateFormat: "none",
		batteryFormat: "none",
	},
	voltage: 3.9,
	timezone: "America/Toronto",
	...over,
});

describe("resolveFooterPlan", () => {
	beforeEach(() => jest.clearAllMocks());

	it("returns a plan for a device with the footer on", async () => {
		load.mockResolvedValue(context());
		const plan = await resolveFooterPlan("key", { ...size, now });
		expect(plan?.parts.center).toBe("Hi");
		expect(plan?.contentHeight).toBe(446);
	});

	it("returns null without a device key and does not query", async () => {
		expect(await resolveFooterPlan(null, { ...size, now })).toBeNull();
		expect(load).not.toHaveBeenCalled();
	});

	it("returns null for an unknown device or when the footer is off", async () => {
		load.mockResolvedValue(null);
		expect(await resolveFooterPlan("key", { ...size, now })).toBeNull();
		load.mockResolvedValue(
			context({ config: { ...context().config, enabled: false } }),
		);
		expect(await resolveFooterPlan("key", { ...size, now })).toBeNull();
	});

	it("never throws: a lookup failure means no footer", async () => {
		load.mockRejectedValue(new Error("db down"));
		await expect(
			resolveFooterPlan("key", { ...size, now }),
		).resolves.toBeNull();
	});
});
