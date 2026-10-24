/// <reference types="jest" />
import { mapDeviceRow } from "@/lib/database/mappers";

describe("mapDeviceRow", () => {
	it("serializes timestamp Date values from pg", () => {
		const lastUpdate = new Date("2026-06-30T09:05:48.931Z");
		const nextExpected = new Date("2026-06-30T09:06:48.931Z");

		const device = mapDeviceRow({
			id: 1,
			name: "Test device",
			mac_address: "AA:BB:CC:DD:EE:FF",
			api_key: "test-api-key",
			friendly_id: "CHKD0E",
			timezone: "UTC",
			last_update_time: lastUpdate,
			next_expected_update: nextExpected,
			display_mode: "screen",
		});

		expect(device.last_update_time).toBe(lastUpdate.toISOString());
		expect(device.next_expected_update).toBe(nextExpected.toISOString());
	});

	it("treats a row without the global footer columns as footer off", () => {
		const device = mapDeviceRow({ id: 1, display_mode: "screen" });

		expect(device.global_footer_enabled).toBe(false);
		expect(device.global_footer_text).toBe("");
		expect(device.global_footer_date_format).toBe("none");
		expect(device.global_footer_battery_format).toBe("none");
	});

	it("maps the global footer columns", () => {
		const device = mapDeviceRow({
			id: 1,
			display_mode: "screen",
			global_footer_enabled: true,
			global_footer_text: "Yin's board",
			global_footer_date_format: "DD-MMM-YYYY",
			global_footer_battery_format: "voltage",
		});

		expect(device.global_footer_enabled).toBe(true);
		expect(device.global_footer_text).toBe("Yin's board");
		expect(device.global_footer_date_format).toBe("DD-MMM-YYYY");
		expect(device.global_footer_battery_format).toBe("voltage");
	});

	it("reads a date format stored before the pattern names", () => {
		const device = mapDeviceRow({
			id: 1,
			display_mode: "screen",
			global_footer_date_format: "iso",
		});

		expect(device.global_footer_date_format).toBe("YYYY-MM-DD");
	});
});
