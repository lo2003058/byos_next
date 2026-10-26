import { Dot } from "../year-progress/dot-grid";

export type DayState = "off" | "before" | "working" | "done";

/** "3h 20m" for a number of minutes. */
export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}m`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** The one-line status under the dots. */
export function dayLine(
	state: DayState,
	minutesLeft: number,
	startTime: string,
	endTime: string,
): string {
	switch (state) {
		case "off":
			return "Day off";
		case "before":
			return `Starts ${startTime} · off at ${endTime}`;
		case "done":
			return `Done for today · off at ${endTime}`;
		default:
			return `Off at ${endTime} · ${formatDuration(minutesLeft)} left`;
	}
}

/** One dot per half hour of the workday: done, the one under way, then to come. */
export function WorkdayDots({
	count,
	percent,
	state,
	width,
	maxSize = 40,
}: {
	count: number;
	percent: number;
	state: DayState;
	width: number;
	maxSize?: number;
}) {
	const gap = Math.max(3, Math.round(width / count / 7));
	const size = Math.min(
		maxSize,
		Math.max(6, Math.floor((width - gap * (count - 1)) / count)),
	);
	const finished =
		state === "done" ? count : Math.floor((percent / 100) * count);
	return (
		<div style={{ display: "flex", flexDirection: "row", gap }}>
			{Array.from({ length: count }, (_, index) => (
				<Dot
					key={index}
					size={size}
					state={
						index < finished
							? "done"
							: index === finished && state === "working"
								? "today"
								: "future"
					}
				/>
			))}
		</div>
	);
}
