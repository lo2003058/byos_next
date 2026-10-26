export const PAY_TYPE_OPTIONS = [
	{ value: "annual", label: "Annual salary" },
	{ value: "monthly", label: "Monthly salary" },
	{ value: "daily", label: "Daily rate" },
	{ value: "hourly", label: "Hourly rate" },
];

/** Currency code and the symbol shown before amounts. */
export const CURRENCIES = [
	{ value: "CAD", label: "CAD — Canadian dollar", symbol: "$" },
	{ value: "USD", label: "USD — US dollar", symbol: "US$" },
	{ value: "HKD", label: "HKD — Hong Kong dollar", symbol: "HK$" },
	{ value: "GBP", label: "GBP — Pound sterling", symbol: "£" },
	{ value: "EUR", label: "EUR — Euro", symbol: "€" },
	{ value: "CNY", label: "CNY — Chinese yuan", symbol: "¥" },
	{ value: "JPY", label: "JPY — Japanese yen", symbol: "¥" },
	{ value: "AUD", label: "AUD — Australian dollar", symbol: "A$" },
] as const;

export const CURRENCY_OPTIONS = CURRENCIES.map(({ value, label }) => ({
	value,
	label,
}));

export function currencySymbol(code: string): string {
	return CURRENCIES.find((currency) => currency.value === code)?.symbol ?? "$";
}

const HALF_HOURS = Array.from({ length: 48 }, (_, index) => {
	const hours = String(Math.floor(index / 2)).padStart(2, "0");
	return `${hours}:${index % 2 === 0 ? "00" : "30"}`;
});

/** Every half hour of the day, for the start and end time pickers. */
export const TIME_OPTIONS = HALF_HOURS.map((time) => ({
	value: time,
	label: time,
}));
