const SEGMENTS = 4;

/** Simple calendar glyph: outlined page, filled header bar, two binder tabs. */
export function CalendarIcon({ size }: { size: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			role="img"
			aria-label="Calendar"
		>
			<rect
				x="3"
				y="5"
				width="18"
				height="16"
				rx="2"
				fill="none"
				stroke="#000"
				strokeWidth="2"
			/>
			<rect x="3" y="5" width="18" height="6" fill="#000" />
			<rect x="7" y="2" width="2.5" height="5" rx="1" fill="#000" />
			<rect x="14.5" y="2" width="2.5" height="5" rx="1" fill="#000" />
		</svg>
	);
}

/** Battery glyph with four segments filled in proportion to `level` (0-100). */
export function BatteryIcon({
	size,
	level,
	charging,
}: {
	size: number;
	level: number;
	charging: boolean;
}) {
	const filled = charging
		? SEGMENTS
		: Math.max(0, Math.min(SEGMENTS, Math.round((level / 100) * SEGMENTS)));
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 28 24"
			width={Math.round(size * (28 / 24))}
			height={size}
			role="img"
			aria-label="Battery"
		>
			<rect
				x="2"
				y="6"
				width="21"
				height="12"
				rx="2"
				fill="none"
				stroke="#000"
				strokeWidth="2"
			/>
			<rect x="24" y="10" width="2.5" height="4" rx="1" fill="#000" />
			{Array.from({ length: SEGMENTS }, (_, index) =>
				index < filled ? (
					<rect
						key={index}
						data-segment="on"
						x={4.5 + index * 4.5}
						y="8.5"
						width="3.5"
						height="7"
						fill="#000"
					/>
				) : null,
			)}
		</svg>
	);
}
