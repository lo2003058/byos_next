const WHOLE = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

/** "$1,234" — whole units, since an e-ink refresh is minutes apart. */
export function formatMoney(value: number, currency: string): string {
	return `${currency}${WHOLE.format(value)}`;
}
