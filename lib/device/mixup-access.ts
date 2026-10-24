import { mixupScreenId } from "@/lib/playlists/screen-ref";

export type MixupAccessDevice = {
	user_id: string | null;
	mixup_id: string | null;
	playlist_id: string | null;
};

/** Does `playlistId` (owned by `userId`) contain an item with this `screenId`? */
export type PlaylistHasScreen = (
	userId: string,
	playlistId: string,
	screenId: string,
) => Promise<boolean>;

/**
 * A device may fetch a mixup image only when that exact mixup is assigned to
 * it or is an item of its own playlist. Never "any mixup the owner has".
 */
export async function canDeviceRenderMixup(
	device: MixupAccessDevice,
	mixupId: string,
	playlistHasScreen: PlaylistHasScreen,
): Promise<boolean> {
	if (!device.user_id) return false;
	if (device.mixup_id === mixupId) return true;
	if (!device.playlist_id) return false;
	return playlistHasScreen(
		device.user_id,
		device.playlist_id,
		mixupScreenId(mixupId),
	);
}
