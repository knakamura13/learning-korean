/**
 * db.ts — lazy Postgres access for the account API.
 *
 * The database is optional by design: without DATABASE_URL every API route
 * answers "unavailable" and the client runs as the guest app, which is also
 * what a plain static build gets. Nothing here may run at build time —
 * prerendering executes hooks and Railway's private network does not exist
 * inside `docker build` — so everything is gated on `building` and connects
 * only on first use.
 *
 * Schema changes are an idempotent bootstrap (CREATE IF NOT EXISTS) run once
 * per process before the first query. Three tables for one small circle do
 * not need a migrations framework; if an ALTER is ever needed, add a
 * schema_version table then.
 */

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
	id                  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	google_sub          text UNIQUE NOT NULL,
	email               text NOT NULL,
	name                text,
	new_per_day         integer NOT NULL DEFAULT 10 CHECK (new_per_day BETWEEN 0 AND 50),
	reviews_per_sitting integer NOT NULL DEFAULT 10 CHECK (reviews_per_sitting BETWEEN 1 AND 100),
	created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
	token_hash  text PRIMARY KEY,
	user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS account_state (
	user_id     integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	rev         integer NOT NULL,
	doc         jsonb NOT NULL,
	updated_at  timestamptz NOT NULL DEFAULT now()
);
`;

export type Sql = postgres.Sql;

let client: Sql | null = null;
let ready: Promise<Sql> | null = null;

/** Idempotent bootstrap; exported so the integration test can run it on a fresh DB. */
export async function migrate(sql: Sql): Promise<void> {
	await sql.unsafe(SCHEMA);
}

/**
 * The connected, migrated client — or null when no database is configured
 * (or at build time). Callers treat null as "run as the guest app".
 */
export function getDb(): Promise<Sql> | null {
	if (building) return null;
	const url = env.DATABASE_URL;
	if (!url) return null;
	if (!ready) {
		client = postgres(url, { max: 5, onnotice: () => {} });
		const sql = client;
		ready = migrate(sql).then(() => sql);
	}
	return ready;
}
