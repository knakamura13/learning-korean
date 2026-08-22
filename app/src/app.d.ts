// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Repo, SessionUser } from '$lib/server/repo';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Null when no database is configured (guest/static deployments). */
			repo: Repo | null;
			/** Null when the request carries no live session. */
			user: SessionUser | null;
			/** Hash of the presented session token, for logout. */
			sessionTokenHash: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
