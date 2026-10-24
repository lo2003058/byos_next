/// <reference types="jest" />
jest.mock("./device-footer", () => ({ loadDeviceFooter: jest.fn() }));
jest.mock("@/lib/logger", () => ({
	logError: jest.fn(),
	logInfo: jest.fn(),
	logWarn: jest.fn(),
}));

import { loadDeviceFooter } from "./device-footer";
import { resolveDeviceRenderContext } from "./resolve";

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

describe("resolveDeviceRenderContext", () => {
	beforeEach(() => jest.clearAllMocks());

	it("returns a plan for a device with the footer on", async () => {
		load.mockResolvedValue(context());
		const result = await resolveDeviceRenderContext("key", { ...size, now });
		expect(result.footer?.parts.center).toBe("Hi");
		expect(result.footer?.contentHeight).toBe(446);
		expect(result.timezone).toBe("America/Toronto");
	});

	it("returns null without a device key and does not query", async () => {
		expect(await resolveDeviceRenderContext(null, { ...size, now })).toEqual({
			footer: null,
			timezone: null,
		});
		expect(load).not.toHaveBeenCalled();
	});

	it("returns null for an unknown device or when the footer is off", async () => {
		load.mockResolvedValue(null);
		expect(await resolveDeviceRenderContext("key", { ...size, now })).toEqual({
			footer: null,
			timezone: null,
		});
		load.mockResolvedValue(
			context({ config: { ...context().config, enabled: false } }),
		);
		const off = await resolveDeviceRenderContext("key", { ...size, now });
		expect(off.footer).toBeNull();
		expect(off.timezone).toBe("America/Toronto");
	});

	it("never throws: a lookup failure means no footer", async () => {
		load.mockRejectedValue(new Error("db down"));
		await expect(
			resolveDeviceRenderContext("key", { ...size, now }),
		).resolves.toEqual({ footer: null, timezone: null });
	});
});
