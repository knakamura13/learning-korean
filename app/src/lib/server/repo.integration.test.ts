/**
 * Real-Postgres coverage for repo.ts and the bootstrap migration. Runs when
 * TEST_DATABASE_URL is set (CI provides a service container); skipped
 * otherwise so `pnpm test` needs no local database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { migrate } from './db';
import { createRepo, type Repo } from './repo';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('repo against Postgres', () => {
	let sql: postgres.Sql;
	let repo: Repo;

	beforeAll(async () => {
		sql = postgres(url!, { max: 2, onnotice: () => {} });
		await migrate(sql);
		// A second run must be a no-op — the bootstrap is idempotent.
		await migrate(sql);
		await sql`TRUNCATE users RESTART IDENTITY CASCADE`;
		repo = createRepo(sql);
	});

	afterAll(async () => {
		await sql?.end();
	});

	it('upserts by google_sub and refreshes the profile', async () => {
		const first = await repo.upsertUser('sub-1', 'old@example.com', 'Old Name');
		const second = await repo.upsertUser('sub-1', 'new@example.com', 'New Name');
		expect(second.id).toBe(first.id);
		expect(second.email).toBe('new@example.com');
		expect(second.newPerDay).toBe(10);
	});

	it('round-trips a session and honors expiry', async () => {
		const user = await repo.upsertUser('sub-2', 'k@example.com', null);
		const now = new Date();
		await repo.createSession('hash-live', user.id, new Date(now.getTime() + 60_000));
		await repo.createSession('hash-dead', user.id, new Date(now.getTime() - 60_000));

		const live = await repo.userForSession('hash-live', now);
		expect(live?.user.id).toBe(user.id);
		expect(await repo.userForSession('hash-dead', now)).toBeNull();
		expect(await repo.userForSession('hash-missing', now)).toBeNull();

		const later = new Date(now.getTime() + 120_000);
		await repo.extendSession('hash-live', later);
		expect((await repo.userForSession('hash-live', now))?.expiresAt.getTime()).toBe(
			later.getTime()
		);

		await repo.deleteSession('hash-live');
		expect(await repo.userForSession('hash-live', now)).toBeNull();
	});

	it('CAS-writes state: first insert, conflict, then a clean bump', async () => {
		const user = await repo.upsertUser('sub-3', 's@example.com', null);
		expect(await repo.getState(user.id)).toBeNull();

		expect(await repo.putState(user.id, 0, { n: 1 })).toBe(1);
		// A second baseRev-0 write must lose, not overwrite.
		expect(await repo.putState(user.id, 0, { n: 99 })).toBeNull();
		// A stale rev must lose.
		expect(await repo.putState(user.id, 5, { n: 99 })).toBeNull();
		expect(await repo.putState(user.id, 1, { n: 2 })).toBe(2);

		const state = await repo.getState(user.id);
		expect(state).toEqual({ rev: 2, doc: { n: 2 } });
	});

	it('stores prefs within the DB check ranges', async () => {
		const user = await repo.upsertUser('sub-4', 'p@example.com', null);
		const updated = await repo.setPrefs(user.id, 0, 25);
		expect(updated).toMatchObject({ newPerDay: 0, reviewsPerSitting: 25 });
	});

	it('hard-deletes a user and cascades sessions and state', async () => {
		const user = await repo.upsertUser('sub-5', 'd@example.com', null);
		await repo.createSession('hash-del', user.id, new Date(Date.now() + 60_000));
		await repo.putState(user.id, 0, { n: 1 });

		await repo.deleteUser(user.id);
		expect(await repo.userForSession('hash-del', new Date())).toBeNull();
		expect(await repo.getState(user.id)).toBeNull();
		const rows = await sql`SELECT id FROM users WHERE id = ${user.id}`;
		expect(rows.length).toBe(0);
	});
});
