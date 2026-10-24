import { mixupScreenId } from "./screen-ref";

export type ScreenOption = { slug: string; name: string };

/** What a playlist frame can show: every recipe, then every mixup. */
export function buildScreenOptions(
	recipes: ScreenOption[],
	mixups: { id: string; name: string }[],
): ScreenOption[] {
	return [
		...recipes.map(({ slug, name }) => ({ slug, name })),
		...mixups.map((mixup) => ({
			slug: mixupScreenId(mixup.id),
			name: `Mixup: ${mixup.name}`,
		})),
	];
}
