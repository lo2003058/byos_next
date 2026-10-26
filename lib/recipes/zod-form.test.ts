/// <reference types="jest" />
import { z } from "zod";
import { zodObjectToParamDefinitions } from "./zod-form";

describe("zodObjectToParamDefinitions", () => {
	it("keeps the title, default and placeholder of plain fields", () => {
		const schema = z.object({
			name: z
				.string()
				.default("Yin")
				.describe("Your name")
				.meta({ title: "Name", placeholder: "Yin" }),
		});
		expect(zodObjectToParamDefinitions(schema)).toEqual({
			name: {
				label: "Name",
				type: "string",
				description: "Your name",
				default: "Yin",
				placeholder: "Yin",
			},
		});
	});

	it("passes a select input and its options through", () => {
		const options = [
			{ value: "a", label: "A" },
			{ value: "b", label: "B" },
		];
		const schema = z.object({
			pick: z
				.string()
				.default("a")
				.meta({ title: "Pick", input: { kind: "select", options } }),
		});
		expect(zodObjectToParamDefinitions(schema).pick?.input).toEqual({
			kind: "select",
			options,
		});
	});

	it("passes a weekdays input through", () => {
		const schema = z.object({
			days: z
				.string()
				.default("Mon-Fri")
				.meta({ title: "Days", input: { kind: "weekdays" } }),
		});
		expect(zodObjectToParamDefinitions(schema).days?.input).toEqual({
			kind: "weekdays",
		});
	});
});
