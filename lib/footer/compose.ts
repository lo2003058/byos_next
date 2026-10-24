import sharp from "sharp";

/** Stack `content` on top of `footer` on one `width` x `height` PNG. */
export async function composeWithFooter({
	content,
	footer,
	width,
	height,
	footerHeight,
}: {
	content: Buffer;
	footer: Buffer;
	width: number;
	height: number;
	footerHeight: number;
}): Promise<Buffer> {
	// A supersampled recipe render arrives larger than the canvas; fit it first.
	const fitted = await sharp(content)
		.resize(width, height - footerHeight, { fit: "fill" })
		.png()
		.toBuffer();
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 255, g: 255, b: 255 },
		},
	})
		.composite([
			{ input: fitted, top: 0, left: 0 },
			{ input: footer, top: height - footerHeight, left: 0 },
		])
		.png()
		.toBuffer();
}
