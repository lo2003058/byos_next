/** A crying face drawn as an outline, since the renderer has no emoji font. */
export function CryingFace({ size }: { size: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			width={size}
			height={size}
			role="img"
			aria-label="Crying face"
			fill="none"
			stroke="#000"
			strokeWidth="6"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="50" cy="50" r="44" />
			<path d="M24 36 L40 42 L24 48" />
			<path d="M76 36 L60 42 L76 48" />
			<path d="M34 76 Q50 56 66 76 Z" />
			<path d="M26 58 Q22 70 26 80" />
			<path d="M74 58 Q78 70 74 80" />
		</svg>
	);
}
