import { mapDeviceRow } from "@/lib/database/mappers";
import { withDeviceApiKey } from "@/lib/database/scoped-db";
import { type FooterConfig, normalizeFooterConfig } from "./config";

export type DeviceFooterContext = {
	config: FooterConfig;
	voltage: number | null;
	timezone: string;
};

/**
 * Footer settings, battery and timezone of the device that owns `apiKey`.
 * Null when the key is missing or unknown. Reads the whole row so a database
 * without the footer columns still works (footer off).
 */
export async function loadDeviceFooter(
	apiKey: string | null | undefined,
): Promise<DeviceFooterContext | null> {
	if (!apiKey) return null;
	const row = await withDeviceApiKey(apiKey, (scopedDb) =>
		scopedDb
			.selectFrom("devices")
			.selectAll()
			.where("api_key", "=", apiKey)
			.executeTakeFirst(),
	);
	if (!row) return null;
	const device = mapDeviceRow(row as Record<string, unknown>);
	return {
		config: normalizeFooterConfig({
			global_footer_enabled: device.global_footer_enabled,
			global_footer_text: device.global_footer_text,
			global_footer_date_format: device.global_footer_date_format,
			global_footer_battery_format: device.global_footer_battery_format,
		}),
		voltage: device.battery_voltage,
		timezone: device.timezone,
	};
}
