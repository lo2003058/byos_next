import { logError } from "@/lib/logger";
import { loadDeviceFooter } from "./device-footer";
import { type FooterPlan, planFooter } from "./plan";

/**
 * Footer plan for the device behind `apiKey`, or null. A failure here must
 * never stop the screen from rendering, so errors are logged and swallowed.
 */
export async function resolveFooterPlan(
	apiKey: string | null | undefined,
	{ width, height, now }: { width: number; height: number; now: number },
): Promise<FooterPlan | null> {
	if (!apiKey) return null;
	try {
		const device = await loadDeviceFooter(apiKey);
		if (!device) return null;
		return planFooter(device.config, {
			now,
			timezone: device.timezone,
			voltage: device.voltage,
			width,
			height,
		});
	} catch (error) {
		logError(error instanceof Error ? error : new Error(String(error)), {
			source: "footer",
			metadata: { stage: "resolveFooterPlan" },
		});
		return null;
	}
}
