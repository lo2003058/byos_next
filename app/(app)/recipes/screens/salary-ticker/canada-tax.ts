import {
	type Bracket,
	type OntarioRules,
	type ProvinceCode,
	TAX_YEARS,
	type TaxYearData,
} from "./canada-tax-data";

export type { ProvinceCode } from "./canada-tax-data";

export type Deductions = {
	incomeTax: number;
	/** CPP and CPP2, or QPP and QPP2 in Quebec. */
	cpp: number;
	/** EI, plus QPIP in Quebec. */
	ei: number;
	total: number;
};

export const DEFAULT_PROVINCE: ProvinceCode = "ON";

export const PROVINCE_OPTIONS: { value: ProvinceCode; label: string }[] = (
	Object.entries(TAX_YEARS[TAX_YEARS.length - 1].provinces) as [
		ProvinceCode,
		{ name: string },
	][]
)
	.map(([value, { name }]) => ({ value, label: name }))
	.sort((a, b) => a.label.localeCompare(b.label));

/** The table for `year`, or the nearest one when that year isn't loaded. */
export function taxYearData(year: number): TaxYearData {
	const sorted = [...TAX_YEARS].sort((a, b) => a.year - b.year);
	const earlier = sorted.filter((data) => data.year <= year);
	return earlier[earlier.length - 1] ?? sorted[0];
}

function bracketTax(income: number, brackets: Bracket[]): number {
	let tax = 0;
	let lower = 0;
	for (const { upTo, rate } of brackets) {
		if (income > lower) tax += (Math.min(income, upTo) - lower) * rate;
		lower = upTo;
	}
	return tax;
}

function federalBasicAmount(
	income: number,
	federal: TaxYearData["federal"],
): number {
	const { basicAmountMax, basicAmountMin } = federal;
	const { basicPhaseOutStart: start, basicPhaseOutEnd: end } = federal;
	if (income <= start) return basicAmountMax;
	if (income >= end) return basicAmountMin;
	const share = (income - start) / (end - start);
	return basicAmountMax - (basicAmountMax - basicAmountMin) * share;
}

function ontarioHealthPremium(
	income: number,
	tiers: OntarioRules["healthPremium"],
): number {
	let previousLimit = 0;
	let previousAmount = 0;
	for (const { upTo, amount, slidingRate } of tiers) {
		if (income <= upTo) {
			return slidingRate === undefined
				? amount
				: Math.min(
						amount,
						previousAmount + slidingRate * (income - previousLimit),
					);
		}
		previousLimit = upTo;
		previousAmount = amount;
	}
	return previousAmount;
}

function ontarioSurtax(tax: number, rules: OntarioRules): number {
	return rules.surtax.reduce(
		(sum, { threshold, rate }) => sum + rate * Math.max(0, tax - threshold),
		0,
	);
}

type Contributions = {
	pension: number;
	/** Pension part that earns a tax credit. */
	pensionBase: number;
	/** Pension part that is deducted from income instead. */
	pensionDeductible: number;
	ei: number;
	qpip: number;
};

function contributions(
	income: number,
	quebec: boolean,
	data: TaxYearData,
): Contributions {
	const { cpp, qpp, ei, qpip } = data;
	const pensionable = Math.min(
		Math.max(income - cpp.basicExemption, 0),
		cpp.maxEarnings - cpp.basicExemption,
	);
	const rate = quebec ? qpp.rate : cpp.rate;
	const baseRate = quebec ? qpp.baseRate : cpp.baseRate;
	const second =
		Math.min(
			Math.max(income - cpp.maxEarnings, 0),
			cpp.maxEarnings2 - cpp.maxEarnings,
		) * cpp.rate2;
	return {
		pension: pensionable * rate + second,
		pensionBase: pensionable * baseRate,
		pensionDeductible: pensionable * (rate - baseRate) + second,
		ei: Math.min(income, ei.maxInsurable) * (quebec ? ei.quebecRate : ei.rate),
		qpip: quebec ? Math.min(income, qpip.maxInsurable) * qpip.rate : 0,
	};
}

function federalTax(
	income: number,
	taxable: number,
	paid: Contributions,
	quebec: boolean,
	data: TaxYearData,
): number {
	const { federal } = data;
	const credits =
		federalBasicAmount(taxable, federal) +
		Math.min(federal.employmentAmount, income) +
		paid.pensionBase +
		paid.ei +
		paid.qpip;
	const tax = Math.max(
		0,
		bracketTax(taxable, federal.brackets) - federal.creditRate * credits,
	);
	return quebec ? tax * (1 - federal.quebecAbatement) : tax;
}

function provincialTax(
	taxable: number,
	province: ProvinceCode,
	paid: Contributions,
	data: TaxYearData,
): number {
	const rules = data.provinces[province];
	const creditRate = rules.brackets[0].rate;
	const credits = rules.basicAmount + paid.pensionBase + paid.ei + paid.qpip;
	if (province === "QC") {
		const quebecTaxable = taxable - paid.qpip;
		return Math.max(
			0,
			bracketTax(quebecTaxable, rules.brackets) - creditRate * credits,
		);
	}
	const base = Math.max(
		0,
		bracketTax(taxable, rules.brackets) - creditRate * credits,
	);
	if (province !== "ON") return base;
	return (
		base +
		ontarioSurtax(base, data.ontario) +
		ontarioHealthPremium(taxable, data.ontario.healthPremium)
	);
}

/**
 * Income tax and payroll deductions on a year's pay, using the rules of
 * `year`: the federal and provincial tax, CPP/QPP, EI and QPIP.
 */
export function annualDeductions(
	income: number,
	province: ProvinceCode,
	year: number,
): Deductions {
	if (income <= 0) return { incomeTax: 0, cpp: 0, ei: 0, total: 0 };
	const data = taxYearData(year);
	const quebec = province === "QC";
	const paid = contributions(income, quebec, data);
	const taxable = income - paid.pensionDeductible;
	const incomeTax =
		federalTax(income, taxable, paid, quebec, data) +
		provincialTax(taxable, province, paid, data);
	const ei = paid.ei + paid.qpip;
	return {
		incomeTax,
		cpp: paid.pension,
		ei,
		total: incomeTax + paid.pension + ei,
	};
}

/** Share of gross pay left after deductions, 1 when there is no pay. */
export function takeHomeShare(
	income: number,
	province: ProvinceCode,
	year: number,
): number {
	if (income <= 0) return 1;
	const { total } = annualDeductions(income, province, year);
	return Math.max(0, 1 - total / income);
}
