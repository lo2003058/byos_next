import { createHash } from "crypto";
import { SQL_STATEMENTS } from "@/lib/database/sql-statements";

// The runner is plain CommonJS so CI can run it with `node` and no build step.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const migrate = require("./migrate.js") as {
	LEDGER_MIGRATION: string;
	checksumSql: (sql: string) => string;
	parseMigrationFile: (
		content: string,
		fileName: string,
	) => { key: string; sql: string };
	loadMigrations: (dir: string) => { key: string; sql: string }[];
	planMigrations: (
		migrations: { key: string; sql: string }[],
		applied: Map<string, string>,
	) => {
		pending: { key: string; sql: string }[];
		skipped: string[];
		mismatch: string | null;
	};
	runMigrations: (
		db: FakeDb,
		migrations: { key: string; sql: string }[],
		log?: (line: string) => void,
	) => Promise<{ applied: string[]; skipped: string[] }>;
};

type FakeDb = {
	ensureLedger: (sql: string, checksum: string) => Promise<void>;
	getApplied: () => Promise<Map<string, string>>;
	apply: (key: string, sql: string, checksum: string) => Promise<void>;
};

function fakeDb(initial: Record<string, string> = {}) {
	const applied = new Map(Object.entries(initial));
	const executed: string[] = [];
	const db: FakeDb = {
		ensureLedger: async (_sql, checksum) => {
			if (!applied.has(migrate.LEDGER_MIGRATION)) {
				applied.set(migrate.LEDGER_MIGRATION, checksum);
				executed.push(migrate.LEDGER_MIGRATION);
			}
		},
		getApplied: async () => new Map(applied),
		apply: async (key, _sql, checksum) => {
			applied.set(key, checksum);
			executed.push(key);
		},
	};
	return { db, applied, executed };
}

const sha = (sql: string) => createHash("sha256").update(sql).digest("hex");

describe("migrate runner", () => {
	test("parseMigrationFile strips Title/Description headers like the app does", () => {
		const parsed = migrate.parseMigrationFile(
			"-- Title: Add x\n-- Description: Adds x\n\nSELECT 1;\n",
			"0099_add-x.sql",
		);
		expect(parsed.key).toBe("0099_add_x");
		expect(parsed.sql).toBe("SELECT 1;");
	});

	test("checksums match the ones the in-app Initialize action records", () => {
		const loaded = migrate.loadMigrations(`${process.cwd()}/migrations`);
		expect(loaded.length).toBeGreaterThan(20);
		for (const { key, sql } of loaded) {
			const statement = SQL_STATEMENTS[key as keyof typeof SQL_STATEMENTS];
			expect(statement).toBeDefined();
			expect(migrate.checksumSql(sql)).toBe(sha(statement.sql));
		}
	});

	test("planMigrations skips applied ones and keeps file order", () => {
		const migrations = [
			{ key: "0001_a", sql: "a" },
			{ key: "0002_b", sql: "b" },
			{ key: "0003_c", sql: "c" },
		];
		const plan = migrate.planMigrations(
			migrations,
			new Map([["0001_a", sha("a")]]),
		);
		expect(plan.mismatch).toBeNull();
		expect(plan.skipped).toEqual(["0001_a"]);
		expect(plan.pending.map((m) => m.key)).toEqual(["0002_b", "0003_c"]);
	});

	test("planMigrations flags an applied migration whose file changed", () => {
		const plan = migrate.planMigrations(
			[{ key: "0001_a", sql: "a-edited" }],
			new Map([["0001_a", sha("a")]]),
		);
		expect(plan.mismatch).toBe("0001_a");
	});

	test("runMigrations applies the ledger first, then pending migrations", async () => {
		const { db, executed } = fakeDb();
		const result = await migrate.runMigrations(db, [
			{ key: migrate.LEDGER_MIGRATION, sql: "ledger" },
			{ key: "0001_a", sql: "a" },
			{ key: "0013_z", sql: "z" },
		]);
		expect(executed).toEqual([migrate.LEDGER_MIGRATION, "0001_a", "0013_z"]);
		expect(result.applied).toEqual(["0001_a", "0013_z"]);
	});

	test("running twice applies nothing the second time", async () => {
		const { db, executed } = fakeDb();
		const migrations = [
			{ key: migrate.LEDGER_MIGRATION, sql: "ledger" },
			{ key: "0001_a", sql: "a" },
		];
		await migrate.runMigrations(db, migrations);
		executed.length = 0;
		const second = await migrate.runMigrations(db, migrations);
		expect(executed).toEqual([]);
		expect(second.applied).toEqual([]);
		expect(second.skipped).toEqual(["0001_a"]);
	});

	test("refuses to run when an applied migration was edited", async () => {
		const { db, executed } = fakeDb({
			[migrate.LEDGER_MIGRATION]: sha("ledger"),
			"0001_a": sha("a"),
		});
		await expect(
			migrate.runMigrations(db, [
				{ key: migrate.LEDGER_MIGRATION, sql: "ledger" },
				{ key: "0001_a", sql: "a-edited" },
				{ key: "0002_b", sql: "b" },
			]),
		).rejects.toThrow(/0001_a.*different checksum/);
		expect(executed).toEqual([]);
	});
});
