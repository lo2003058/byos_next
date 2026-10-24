/** Keeps the items whose `key` flag is on; a flag that is not set counts as on. */
export function selectStats<T extends { key: string }>(
	items: T[],
	flags: Record<string, boolean | undefined>,
): T[] {
	return items.filter((item) => flags[item.key] !== false);
}

/** Column count for the stats grid: 7-8 stats take 2 rows of 4, 4 form a 2x2. */
export function gridColumns(count: number, isHalfScreen: boolean): number {
	if (isHalfScreen) return 2;
	if (count >= 7) return 4;
	if (count === 4) return 2;
	return Math.max(1, Math.min(3, count));
}
