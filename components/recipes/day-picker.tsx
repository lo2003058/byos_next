"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { datesFrom, monthCells, toggleDate } from "@/lib/recipes/day-picker";

const HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A month of checkboxes for picking dates; other months' picks are kept. */
export function DayPicker({
	id,
	value,
	onChange,
}: {
	id: string;
	value: string;
	onChange: (next: string) => void;
}) {
	const [shown, setShown] = useState(() => {
		const today = new Date();
		return { year: today.getFullYear(), month: today.getMonth() + 1 };
	});
	const picked = datesFrom(value);
	const step = (by: number) =>
		setShown(({ year, month }) => {
			const index = year * 12 + (month - 1) + by;
			return { year: Math.floor(index / 12), month: (index % 12) + 1 };
		});
	const title = new Date(shown.year, shown.month - 1, 1).toLocaleDateString(
		"en-CA",
		{ month: "long", year: "numeric" },
	);
	const inMonth = picked.filter((date) =>
		date.startsWith(`${shown.year}-${String(shown.month).padStart(2, "0")}-`),
	).length;

	return (
		<div className="inline-flex flex-col gap-2" id={id}>
			<div className="flex items-center justify-between gap-2">
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-7 w-7"
					aria-label="Previous month"
					onClick={() => step(-1)}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<span className="text-sm font-medium">
					{title}
					{inMonth > 0 ? ` · ${inMonth} off` : ""}
				</span>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-7 w-7"
					aria-label="Next month"
					onClick={() => step(1)}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center text-xs">
				{HEADINGS.map((heading) => (
					<span key={heading} className="text-muted-foreground">
						{heading}
					</span>
				))}
				{monthCells(shown.year, shown.month).map((cell, index) =>
					cell ? (
						<label
							key={cell.date}
							className={`flex h-8 w-9 cursor-pointer items-center justify-center rounded-md border text-sm ${
								picked.includes(cell.date)
									? "border-primary bg-primary text-primary-foreground"
									: "hover:bg-muted"
							}`}
						>
							<input
								type="checkbox"
								className="sr-only"
								checked={picked.includes(cell.date)}
								onChange={() => onChange(toggleDate(value, cell.date))}
							/>
							{cell.day}
						</label>
					) : (
						<span key={`blank-${index}`} />
					),
				)}
			</div>
		</div>
	);
}
