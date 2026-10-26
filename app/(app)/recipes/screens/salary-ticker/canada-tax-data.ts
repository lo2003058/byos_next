/**
 * Canadian payroll and income tax rules by tax year. Figures are the
 * published 2026 federal and provincial tables; the personal-amount phase-outs
 * and low-income reductions some provinces add are left out, so results are an
 * estimate of take-home pay, not a payroll-exact figure.
 */

export type ProvinceCode =
	| "AB"
	| "BC"
	| "MB"
	| "NB"
	| "NL"
	| "NS"
	| "NT"
	| "NU"
	| "ON"
	| "PE"
	| "QC"
	| "SK"
	| "YT";

/** Tax `rate` on income up to `upTo`, from the previous bracket's limit. */
export type Bracket = { upTo: number; rate: number };

export type ProvinceRules = {
	name: string;
	brackets: Bracket[];
	basicAmount: number;
};

export type OntarioRules = {
	/** Surtax: share of provincial tax above each threshold. */
	surtax: { threshold: number; rate: number }[];
	/** Health premium by taxable income: flat `amount` up to `upTo`. */
	healthPremium: { upTo: number; amount: number; slidingRate?: number }[];
};

export type TaxYearData = {
	year: number;
	federal: {
		brackets: Bracket[];
		basicAmountMax: number;
		basicAmountMin: number;
		/** Basic amount shrinks between these two incomes. */
		basicPhaseOutStart: number;
		basicPhaseOutEnd: number;
		employmentAmount: number;
		/** Lowest federal rate, also the credit rate. */
		creditRate: number;
		quebecAbatement: number;
	};
	cpp: {
		basicExemption: number;
		maxEarnings: number;
		rate: number;
		/** Part of `rate` that earns a tax credit; the rest is deductible. */
		baseRate: number;
		maxEarnings2: number;
		rate2: number;
	};
	qpp: { rate: number; baseRate: number };
	ei: { maxInsurable: number; rate: number; quebecRate: number };
	qpip: { maxInsurable: number; rate: number };
	provinces: Record<ProvinceCode, ProvinceRules>;
	ontario: OntarioRules;
};

const INF = Number.POSITIVE_INFINITY;

const TAX_2026: TaxYearData = {
	year: 2026,
	federal: {
		brackets: [
			{ upTo: 58523, rate: 0.14 },
			{ upTo: 117045, rate: 0.205 },
			{ upTo: 181440, rate: 0.26 },
			{ upTo: 258482, rate: 0.29 },
			{ upTo: INF, rate: 0.33 },
		],
		basicAmountMax: 16452,
		basicAmountMin: 14829,
		basicPhaseOutStart: 181440,
		basicPhaseOutEnd: 258482,
		employmentAmount: 1501,
		creditRate: 0.14,
		quebecAbatement: 0.165,
	},
	cpp: {
		basicExemption: 3500,
		maxEarnings: 74600,
		rate: 0.0595,
		baseRate: 0.0495,
		maxEarnings2: 85000,
		rate2: 0.04,
	},
	qpp: { rate: 0.063, baseRate: 0.053 },
	ei: { maxInsurable: 68900, rate: 0.0163, quebecRate: 0.013 },
	qpip: { maxInsurable: 103000, rate: 0.0043 },
	provinces: {
		AB: {
			name: "Alberta",
			basicAmount: 22769,
			brackets: [
				{ upTo: 61200, rate: 0.08 },
				{ upTo: 154259, rate: 0.1 },
				{ upTo: 185111, rate: 0.12 },
				{ upTo: 246813, rate: 0.13 },
				{ upTo: 370220, rate: 0.14 },
				{ upTo: INF, rate: 0.15 },
			],
		},
		BC: {
			name: "British Columbia",
			basicAmount: 13216,
			brackets: [
				{ upTo: 50363, rate: 0.0506 },
				{ upTo: 100728, rate: 0.077 },
				{ upTo: 115648, rate: 0.105 },
				{ upTo: 140430, rate: 0.1229 },
				{ upTo: 190405, rate: 0.147 },
				{ upTo: 265545, rate: 0.168 },
				{ upTo: INF, rate: 0.205 },
			],
		},
		MB: {
			name: "Manitoba",
			basicAmount: 15780,
			brackets: [
				{ upTo: 47000, rate: 0.108 },
				{ upTo: 100000, rate: 0.1275 },
				{ upTo: INF, rate: 0.174 },
			],
		},
		NB: {
			name: "New Brunswick",
			basicAmount: 13664,
			brackets: [
				{ upTo: 52333, rate: 0.094 },
				{ upTo: 104666, rate: 0.14 },
				{ upTo: 193861, rate: 0.16 },
				{ upTo: INF, rate: 0.195 },
			],
		},
		NL: {
			name: "Newfoundland and Labrador",
			basicAmount: 11188,
			brackets: [
				{ upTo: 44678, rate: 0.087 },
				{ upTo: 89354, rate: 0.145 },
				{ upTo: 159528, rate: 0.158 },
				{ upTo: 223340, rate: 0.178 },
				{ upTo: 285319, rate: 0.198 },
				{ upTo: 570638, rate: 0.208 },
				{ upTo: 1141275, rate: 0.213 },
				{ upTo: INF, rate: 0.218 },
			],
		},
		NS: {
			name: "Nova Scotia",
			basicAmount: 11932,
			brackets: [
				{ upTo: 30995, rate: 0.0879 },
				{ upTo: 61991, rate: 0.1495 },
				{ upTo: 97417, rate: 0.1667 },
				{ upTo: 157124, rate: 0.175 },
				{ upTo: INF, rate: 0.21 },
			],
		},
		NT: {
			name: "Northwest Territories",
			basicAmount: 18198,
			brackets: [
				{ upTo: 53003, rate: 0.059 },
				{ upTo: 106009, rate: 0.086 },
				{ upTo: 172346, rate: 0.122 },
				{ upTo: INF, rate: 0.1405 },
			],
		},
		NU: {
			name: "Nunavut",
			basicAmount: 19659,
			brackets: [
				{ upTo: 55801, rate: 0.04 },
				{ upTo: 111602, rate: 0.07 },
				{ upTo: 181439, rate: 0.09 },
				{ upTo: INF, rate: 0.115 },
			],
		},
		ON: {
			name: "Ontario",
			basicAmount: 12989,
			brackets: [
				{ upTo: 53891, rate: 0.0505 },
				{ upTo: 107785, rate: 0.0915 },
				{ upTo: 150000, rate: 0.1116 },
				{ upTo: 220000, rate: 0.1216 },
				{ upTo: INF, rate: 0.1316 },
			],
		},
		PE: {
			name: "Prince Edward Island",
			basicAmount: 15000,
			brackets: [
				{ upTo: 33928, rate: 0.095 },
				{ upTo: 65820, rate: 0.1347 },
				{ upTo: 106890, rate: 0.166 },
				{ upTo: 142250, rate: 0.1762 },
				{ upTo: INF, rate: 0.19 },
			],
		},
		QC: {
			name: "Quebec",
			basicAmount: 18952,
			brackets: [
				{ upTo: 54345, rate: 0.14 },
				{ upTo: 108680, rate: 0.19 },
				{ upTo: 132245, rate: 0.24 },
				{ upTo: INF, rate: 0.2575 },
			],
		},
		SK: {
			name: "Saskatchewan",
			basicAmount: 20381,
			brackets: [
				{ upTo: 54532, rate: 0.105 },
				{ upTo: 155805, rate: 0.125 },
				{ upTo: INF, rate: 0.145 },
			],
		},
		YT: {
			name: "Yukon",
			basicAmount: 16452,
			brackets: [
				{ upTo: 58523, rate: 0.064 },
				{ upTo: 117045, rate: 0.09 },
				{ upTo: 181440, rate: 0.109 },
				{ upTo: 500000, rate: 0.128 },
				{ upTo: INF, rate: 0.15 },
			],
		},
	},
	ontario: {
		surtax: [
			{ threshold: 5818, rate: 0.2 },
			{ threshold: 7446, rate: 0.36 },
		],
		healthPremium: [
			{ upTo: 20000, amount: 0 },
			{ upTo: 25000, amount: 300, slidingRate: 0.06 },
			{ upTo: 36000, amount: 300 },
			{ upTo: 38500, amount: 450, slidingRate: 0.06 },
			{ upTo: 48000, amount: 450 },
			{ upTo: 48600, amount: 600, slidingRate: 0.25 },
			{ upTo: 72000, amount: 600 },
			{ upTo: 72600, amount: 750, slidingRate: 0.25 },
			{ upTo: 200000, amount: 750 },
			{ upTo: 200600, amount: 900, slidingRate: 0.25 },
			{ upTo: INF, amount: 900 },
		],
	},
};

/** Tax tables by year; add a year here when its rates are published. */
export const TAX_YEARS: readonly TaxYearData[] = [TAX_2026];
