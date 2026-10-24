/// <reference types="jest" />
import { getSharedPool, resolvePoolMax } from "./pool";

describe("resolvePoolMax", () => {
	it("uses the fallback when the env value is missing or invalid", () => {
		expect(resolvePoolMax(undefined, 5)).toBe(5);
		expect(resolvePoolMax("", 5)).toBe(5);
		expect(resolvePoolMax("abc", 5)).toBe(5);
		expect(resolvePoolMax("0", 5)).toBe(5);
		expect(resolvePoolMax("-3", 5)).toBe(5);
	});

	it("uses a valid positive integer from the env", () => {
		expect(resolvePoolMax("8", 5)).toBe(8);
	});
});

describe("getSharedPool", () => {
	const names: string[] = [];
	const track = (name: string) => {
		names.push(name);
		return name;
	};

	afterEach(async () => {
		const registry = (
			globalThis as { __byosPools?: Map<string, { end(): Promise<void> }> }
		).__byosPools;
		for (const name of names.splice(0)) {
			await registry?.get(name)?.end();
			registry?.delete(name);
		}
	});

	it("returns the same pool for the same name", () => {
		const name = track("test-same");
		const a = getSharedPool(name, {
			connectionString: "postgres://x/y",
			max: 2,
		});
		const b = getSharedPool(name, {
			connectionString: "postgres://x/y",
			max: 9,
		});

		expect(a).toBe(b);
	});

	it("keeps pools with different names separate", () => {
		const a = getSharedPool(track("test-a"), {
			connectionString: "postgres://x/y",
			max: 2,
		});
		const b = getSharedPool(track("test-b"), {
			connectionString: "postgres://x/y",
			max: 2,
		});

		expect(a).not.toBe(b);
	});

	it("caps the pool size", () => {
		const pool = getSharedPool(track("test-max"), {
			connectionString: "postgres://x/y",
			max: 3,
		});

		expect(pool.options.max).toBe(3);
	});

	it("releases idle connections so a dev server does not hog the database", () => {
		const pool = getSharedPool(track("test-idle"), {
			connectionString: "postgres://x/y",
			max: 3,
		});

		expect(pool.options.idleTimeoutMillis).toBeGreaterThan(0);
	});
});
