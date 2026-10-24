import {
	imageResponse,
	type RenderedImageResponse,
} from "@/lib/render/image-response";

/**
 * Return a copy of `response` marked uncacheable.
 *
 * Device image URLs are identical on every refresh, so a CDN that caches by
 * file extension (Cloudflare caches `.png` by default) would keep serving the
 * first render, e.g. stale weather or the pre-edit location.
 */
export function withNoStore(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set("Cache-Control", "no-store");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function noStoreImageResponse(
	image: RenderedImageResponse,
	status = 200,
): Response {
	return withNoStore(imageResponse(image, status));
}
