#!/usr/bin/env node
// Applies migrations/*.sql in order and records them in `schema_migrations`,
// using the same names and checksums as the in-app Initialize action
// (app/actions/execute-sql.ts), so either path can run first.
// Usage: DATABASE_URL=... node scripts/migrate.js

const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const LEDGER_MIGRATION = "0012_create_schema_migrations";

function checksumSql(sql) {
	return createHash("sha256").update(sql).digest("hex");
}

// Mirrors scripts/generate-sql-statements.js so checksums stay identical.
function parseMigrationFile(content, fileName) {
	const sql = content
		.replace(/--\s*Title:\s*.+/i, "")
		.replace(/--\s*Description:\s*.+/i, "")
		.trim();
	return { key: fileName.replace(/\.sql$/, "").replace(/[-\s]/g, "_"), sql };
}

function loadMigrations(dir) {
	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".sql"))
		.sort()
		.map((file) =>
			parseMigrationFile(fs.readFileSync(path.join(dir, file), "utf-8"), file),
		);
}

function planMigrations(migrations, applied) {
	const pending = [];
	const skipped = [];
	for (const migration of migrations) {
		const appliedChecksum = applied.get(migration.key);
		if (!appliedChecksum) {
			pending.push(migration);
		} else if (appliedChecksum !== checksumSql(migration.sql)) {
			return { pending: [], skipped, mismatch: migration.key };
		} else {
			skipped.push(migration.key);
		}
	}
	return { pending, skipped, mismatch: null };
}

async function runMigrations(db, migrations, log = () => {}) {
	const ledger = migrations.find((m) => m.key === LEDGER_MIGRATION);
	if (!ledger) {
		throw new Error(`Missing ${LEDGER_MIGRATION} migration file`);
	}
	await db.ensureLedger(ledger.sql, checksumSql(ledger.sql));

	const rest = migrations.filter((m) => m.key !== LEDGER_MIGRATION);
	const plan = planMigrations(rest, await db.getApplied());
	if (plan.mismatch) {
		throw new Error(
			`Migration ${plan.mismatch} was already applied with a different checksum`,
		);
	}

	const applied = [];
	for (const migration of plan.pending) {
		log(`applying ${migration.key}`);
		await db.apply(migration.key, migration.sql, checksumSql(migration.sql));
		applied.push(migration.key);
	}
	return { applied, skipped: plan.skipped };
}

function createPostgresDb(connectionString) {
	const postgres = require("postgres");
	const sql = postgres(connectionString, {
		ssl: connectionString.includes("sslmode=disable") ? false : "require",
		max: 1,
		onnotice: () => {},
	});
	const db = {
		async ensureLedger(ledgerSql, checksum) {
			await sql.unsafe(ledgerSql);
			await sql`
				INSERT INTO schema_migrations (name, checksum)
				VALUES (${LEDGER_MIGRATION}, ${checksum})
				ON CONFLICT (name) DO NOTHING
			`;
		},
		async getApplied() {
			const rows = await sql`SELECT name, checksum FROM schema_migrations`;
			return new Map(rows.map((row) => [row.name, row.checksum]));
		},
		async apply(key, migrationSql, checksum) {
			await sql.begin(async (trx) => {
				await trx.unsafe(migrationSql);
				await trx`
					INSERT INTO schema_migrations (name, checksum)
					VALUES (${key}, ${checksum})
				`;
			});
		},
	};
	return { db, close: () => sql.end() };
}

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is not defined");
	}
	const migrations = loadMigrations(path.join(__dirname, "../migrations"));
	const { db, close } = createPostgresDb(url);
	try {
		const { applied, skipped } = await runMigrations(db, migrations, (line) =>
			console.log(line),
		);
		console.log(
			`Done: ${applied.length} applied, ${skipped.length + 1} already up to date`,
		);
	} finally {
		await close();
	}
}

module.exports = {
	LEDGER_MIGRATION,
	checksumSql,
	parseMigrationFile,
	loadMigrations,
	planMigrations,
	runMigrations,
};

if (require.main === module) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
