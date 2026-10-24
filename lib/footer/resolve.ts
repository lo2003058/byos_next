import { logError } from "@/lib/logger";
import { loadDeviceFooter } from "./device-footer";
import { type FooterPlan, planFooter } from "./plan";

export type DeviceRenderContext = {
	footer: FooterPlan | null;
	/** IANA timezone of the device, or null when it is unknown. */
	timezone: string | null;
};

const NONE: DeviceRenderContext = { footer: null, timezone: null };

/**
 * What an image render needs to know about the device behind `apiKey`: the
 * global footer plan and the timezone. A failure here must never stop the
 * screen from rendering, so errors are logged and swallowed.
 */
export async function resolveDeviceRenderContext(
	apiKey: string | null | undefined,
	{ width, height, now }: { width: number; height: number; now: number },
): Promise<DeviceRenderContext> {
	if (!apiKey) return NONE;
	try {
		const device = await loadDeviceFooter(apiKey);
		if (!device) return NONE;
		return {
			footer: planFooter(device.config, {
				now,
				timezone: device.timezone,
				voltage: device.voltage,
				width,
				height,
			}),
			timezone: device.timezone,
		};
	} catch (error) {
		logError(error instanceof Error ? error : new Error(String(error)), {
			source: "footer",
			metadata: { stage: "resolveDeviceRenderContext" },
		});
		return NONE;
	}
}
