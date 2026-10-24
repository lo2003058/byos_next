/// <reference types="jest" />
import { canDeviceRenderMixup } from "./mixup-access";

const device = (
	over: Partial<Parameters<typeof canDeviceRenderMixup>[0]> = {},
) => ({
	user_id: "user-1",
	mixup_id: null,
	playlist_id: null,
	...over,
});

describe("canDeviceRenderMixup", () => {
	it("allows the mixup assigned to the device without a playlist lookup", async () => {
		const inPlaylist = jest.fn().mockResolvedValue(false);
		await expect(
			canDeviceRenderMixup(device({ mixup_id: "m1" }), "m1", inPlaylist),
		).resolves.toBe(true);
		expect(inPlaylist).not.toHaveBeenCalled();
	});

	it("allows a mixup that is an item of the device's playlist", async () => {
		const inPlaylist = jest.fn().mockResolvedValue(true);
		await expect(
			canDeviceRenderMixup(device({ playlist_id: "p1" }), "m1", inPlaylist),
		).resolves.toBe(true);
		expect(inPlaylist).toHaveBeenCalledWith("user-1", "p1", "mixup/m1");
	});

	it("denies a mixup that is neither assigned nor in the playlist", async () => {
		const inPlaylist = jest.fn().mockResolvedValue(false);
		await expect(
			canDeviceRenderMixup(
				device({ mixup_id: "other", playlist_id: "p1" }),
				"m1",
				inPlaylist,
			),
		).resolves.toBe(false);
	});

	it("denies a device without a playlist or assigned mixup", async () => {
		const inPlaylist = jest.fn().mockResolvedValue(true);
		await expect(
			canDeviceRenderMixup(device(), "m1", inPlaylist),
		).resolves.toBe(false);
		expect(inPlaylist).not.toHaveBeenCalled();
	});

	it("denies a device that has no owner", async () => {
		const inPlaylist = jest.fn().mockResolvedValue(true);
		await expect(
			canDeviceRenderMixup(
				device({ user_id: null, mixup_id: "m1", playlist_id: "p1" }),
				"m1",
				inPlaylist,
			),
		).resolves.toBe(false);
		expect(inPlaylist).not.toHaveBeenCalled();
	});
});
