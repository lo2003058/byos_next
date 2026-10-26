const WHOLE = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

/** "$1,234" — whole units, since an e-ink refresh is minutes apart. */
export function formatMoney(value: number, currency: string): string {
	return `${currency}${WHOLE.format(value)}`;
}

/** Pay left after tax, with `taxRate` clamped to 0-100 percent. */
export function afterTax(gross: number, taxRate: number): number {
	const rate = Math.min(100, Math.max(0, taxRate));
	return Math.round(gross * (1 - rate / 100) * 100) / 100;
}
