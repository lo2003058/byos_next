import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth/get-user";
import {
	resolveDeviceProfileForRequest,
	resolveDeviceProfileOrNull,
} from "@/lib/device/device-profile-request";
import { noStoreImageResponse } from "@/lib/device/no-store-response";
import {
	parseRequestHeaders,
	resolveUserIdFromApiKey,
} from "@/lib/device/request-headers";
import { resolveFooterPlan } from "@/lib/footer/resolve";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { logger } from "@/lib/recipes/logger";
import { renderRecipeForDevice } from "@/lib/recipes/recipe-renderer";
import { stripImageExtension } from "@/lib/render/device-image-url";
import { renderErrorImage } from "@/lib/render/error-image";
import {
	parseImageRequest,
	rejectOversizedImageArea,
} from "@/lib/render/image-request";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug?: string[] }> },
) {
	const headers = parseRequestHeaders(req);
	try {
		// Always await params as required by Next.js 14/15
		const { slug = ["error"] } = await params;
		const bitmapPath = Array.isArray(slug) ? slug.join("/") : slug;
		const recipeSlug = stripImageExtension(bitmapPath);

		const { searchParams } = new URL(req.url);
		const imageRequest = parseImageRequest(searchParams);
		if (imageRequest instanceof Response) return imageRequest;

		logger.info(`Bitmap request for: ${bitmapPath}`);

		// Devices send an Access-Token; browser previews (an <img> fetch) send the
		// session cookie instead, so fall back to the signed-in user — otherwise
		// user-scoped recipes are invisible and render as "Unknown recipe".
		// The token also travels as `access_token` in the image URL: the server's
		// own precache fetch sends no headers, and the footer needs the device.
		const deviceKey = headers.apiKey ?? searchParams.get("access_token");
		const apiKeyOwnerId = deviceKey
			? await resolveUserIdFromApiKey(deviceKey)
			: null;
		const userId = apiKeyOwnerId ?? (await getCurrentUserId());

		// Forward cookies so browser rendering can reuse the caller's auth session.
		const cookieHeader = req.headers.get("cookie");
		const profile = await resolveDeviceProfileForRequest(headers, {
			modelName: imageRequest.modelName,
			paletteId: imageRequest.paletteId,
		});

		if (recipeSlug === "error") {
			const imageWidth = imageRequest.width ?? profile.model.width;
			const imageHeight = imageRequest.height ?? profile.model.height;
			const oversized = rejectOversizedImageArea(imageWidth, imageHeight);
			if (oversized) return oversized;
			const image = await renderErrorImage({
				message: searchParams.get("message") ?? "Display error",
				width: imageWidth,
				height: imageHeight,
				profile,
			});
			return noStoreImageResponse(image);
		}

		const imageWidth = imageRequest.width ?? profile.model.width;
		const imageHeight = imageRequest.height ?? profile.model.height;
		const oversized = rejectOversizedImageArea(imageWidth, imageHeight);
		if (oversized) return oversized;

		const footer = await resolveFooterPlan(deviceKey, {
			width: imageWidth,
			height: imageHeight,
			now: Date.now(),
		});

		const image = await renderRecipeForDevice({
			slug: recipeSlug,
			profile,
			width: imageWidth,
			height: imageHeight,
			userId,
			cookies: cookieHeader || undefined,
			footer,
		});

		if (!image?.buffer.length) {
			logger.warn(`Failed to generate device image for ${recipeSlug}`);
			const errorImage = await renderErrorImage({
				message: `Could not render ${recipeSlug}`,
				width: imageWidth,
				height: imageHeight,
				profile,
			});
			return noStoreImageResponse(errorImage, 500);
		}

		return noStoreImageResponse(image);
	} catch (error) {
		logger.error("Error generating image:", error);
		const { searchParams } = new URL(req.url);
		const imageRequest = parseImageRequest(searchParams);
		const profile =
			imageRequest instanceof Response
				? null
				: await resolveDeviceProfileOrNull(headers, {
						modelName: imageRequest.modelName,
						paletteId: imageRequest.paletteId,
					});
		const width =
			imageRequest instanceof Response
				? DEFAULT_IMAGE_WIDTH
				: (imageRequest.width ?? profile?.model.width ?? DEFAULT_IMAGE_WIDTH);
		const height =
			imageRequest instanceof Response
				? DEFAULT_IMAGE_HEIGHT
				: (imageRequest.height ??
					profile?.model.height ??
					DEFAULT_IMAGE_HEIGHT);
		const errorImage = await renderErrorImage({
			message: error instanceof Error ? error.message : "Image render failed",
			width,
			height,
			profile,
		});
		return noStoreImageResponse(errorImage, 500);
	}
}
