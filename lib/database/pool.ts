import { Pool, type PoolConfig } from "pg";

/**
 * Process-wide Postgres pools.
 *
 * Next dev evaluates modules once per route bundle and again on every hot
 * reload, so a module-level `new Pool()` multiplies. With node-postgres'
 * default of 10 connections per pool this quickly exhausts small poolers
 * (Supabase session mode allows 15 clients), after which requests queue or
 * fail with EMAXCONNSESSION. Registering pools on `globalThis` keeps one per
 * name per process.
 */

const IDLE_TIMEOUT_MS = 10_000;

type PoolRegistry = Map<string, Pool>;

const globalWithPools = globalThis as typeof globalThis & {
	__byosPools?: PoolRegistry;
};

function registry(): PoolRegistry {
	globalWithPools.__byosPools ??= new Map();
	return globalWithPools.__byosPools;
}

/** Positive integer from an env string, otherwise `fallback`. */
export function resolvePoolMax(
	value: string | undefined,
	fallback: number,
): number {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSharedPool(name: string, config: PoolConfig): Pool {
	const pools = registry();
	const existing = pools.get(name);
	if (existing) return existing;

	const pool = new Pool({ idleTimeoutMillis: IDLE_TIMEOUT_MS, ...config });
	pools.set(name, pool);
	return pool;
}
