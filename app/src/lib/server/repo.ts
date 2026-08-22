/**
 * repo.ts — every SQL statement the API uses, behind plain async methods.
 *
 * Route handlers depend on this interface, not on postgres.js, so they can be
 * unit-tested with an in-memory fake; the real queries get one integration
 * test against Postgres (skipped when TEST_DATABASE_URL is unset).
 */

import type { Sql } from './db';

export interface SessionUser {
	id: number;
	email: string;
	name: string | null;
	newPerDay: number;
	reviewsPerSitting: number;
}

export interface AccountState {
	rev: number;
	doc: unknown;
}

export interface Repo {
	/** Find-or-create by the stable Google account id; refreshes email/name. */
	upsertUser(googleSub: string, email: string, name: string | null): Promise<SessionUser>;
	createSession(tokenHash: string, userId: number, expiresAt: Date): Promise<void>;
	/** The live user for a session (with its expiry), or null when missing/expired. */
	userForSession(
		tokenHash: string,
		now: Date
	): Promise<{ user: SessionUser; expiresAt: Date } | null>;
	extendSession(tokenHash: string, expiresAt: Date): Promise<void>;
	deleteSession(tokenHash: string): Promise<void>;
	getState(userId: number): Promise<AccountState | null>;
	/**
	 * Compare-and-swap write. `baseRev` 0 inserts the first copy; otherwise the
	 * update only lands when the stored rev still matches. Returns the new rev,
	 * or null when the caller lost the race and must merge against the current
	 * copy.
	 */
	putState(userId: number, baseRev: number, doc: unknown): Promise<number | null>;
	setPrefs(userId: number, newPerDay: number, reviewsPerSitting: number): Promise<SessionUser | null>;
	/** Hard delete; sessions and state go with the row via cascade. */
	deleteUser(userId: number): Promise<void>;
}

interface UserRow {
	id: number;
	email: string;
	name: string | null;
	new_per_day: number;
	reviews_per_sitting: number;
}

function toUser(row: UserRow): SessionUser {
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		newPerDay: row.new_per_day,
		reviewsPerSitting: row.reviews_per_sitting
	};
}

export function createRepo(sql: Sql): Repo {
	return {
		async upsertUser(googleSub, email, name) {
			const rows = await sql<UserRow[]>`
				INSERT INTO users (google_sub, email, name)
				VALUES (${googleSub}, ${email}, ${name})
				ON CONFLICT (google_sub)
				DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
				RETURNING id, email, name, new_per_day, reviews_per_sitting
			`;
			return toUser(rows[0]);
		},

		async createSession(tokenHash, userId, expiresAt) {
			await sql`
				INSERT INTO sessions (token_hash, user_id, expires_at)
				VALUES (${tokenHash}, ${userId}, ${expiresAt})
			`;
		},

		async userForSession(tokenHash, now) {
			const rows = await sql<(UserRow & { expires_at: Date })[]>`
				SELECT u.id, u.email, u.name, u.new_per_day, u.reviews_per_sitting, s.expires_at
				FROM sessions s JOIN users u ON u.id = s.user_id
				WHERE s.token_hash = ${tokenHash} AND s.expires_at > ${now}
			`;
			if (!rows.length) return null;
			return { user: toUser(rows[0]), expiresAt: rows[0].expires_at };
		},

		async extendSession(tokenHash, expiresAt) {
			await sql`UPDATE sessions SET expires_at = ${expiresAt} WHERE token_hash = ${tokenHash}`;
		},

		async deleteSession(tokenHash) {
			await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
		},

		async getState(userId) {
			const rows = await sql<{ rev: number; doc: unknown }[]>`
				SELECT rev, doc FROM account_state WHERE user_id = ${userId}
			`;
			return rows.length ? { rev: rows[0].rev, doc: rows[0].doc } : null;
		},

		async putState(userId, baseRev, doc) {
			const body = sql.json(doc as never);
			if (baseRev === 0) {
				const rows = await sql<{ rev: number }[]>`
					INSERT INTO account_state (user_id, rev, doc)
					VALUES (${userId}, 1, ${body})
					ON CONFLICT (user_id) DO NOTHING
					RETURNING rev
				`;
				return rows.length ? rows[0].rev : null;
			}
			const rows = await sql<{ rev: number }[]>`
				UPDATE account_state
				SET rev = rev + 1, doc = ${body}, updated_at = now()
				WHERE user_id = ${userId} AND rev = ${baseRev}
				RETURNING rev
			`;
			return rows.length ? rows[0].rev : null;
		},

		async setPrefs(userId, newPerDay, reviewsPerSitting) {
			const rows = await sql<UserRow[]>`
				UPDATE users
				SET new_per_day = ${newPerDay}, reviews_per_sitting = ${reviewsPerSitting}
				WHERE id = ${userId}
				RETURNING id, email, name, new_per_day, reviews_per_sitting
			`;
			return rows.length ? toUser(rows[0]) : null;
		},

		async deleteUser(userId) {
			await sql`DELETE FROM users WHERE id = ${userId}`;
		}
	};
}
