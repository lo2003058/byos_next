const WHOLE = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

/** "$1,234" — whole units, since an e-ink refresh is minutes apart. */
export function formatMoney(value: number, currency: string): string {
	return `${currency}${WHOLE.format(value)}`;
}

/** A pay rate with enough decimals to read: $0.0079, $0.47, $28.41, $125. */
export function formatRate(value: number, currency: string): string {
	const decimals = value < 0.1 ? 4 : value < 100 ? 2 : 0;
	return `${currency}${value.toFixed(decimals)}`;
}
