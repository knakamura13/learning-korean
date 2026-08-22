/**
 * stateDoc.ts — structural validation of the synced progress document.
 *
 * The wire format is the existing v2 backup envelope, so one validated shape
 * serves export, restore, and sync. Checks here are content-independent on
 * purpose: the server must not import the deck or the lab step counts — the
 * client's revivers own semantic validation.
 */

import { APP_BACKUP_KIND, APP_BACKUP_VERSION } from '$lib/domain/backup';
import { isSrsBackup } from '$lib/domain/srs';
import { LAB_SESSION_VERSION } from '$lib/domain/labSession';

export function isAccountStateDoc(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
	const rec = raw as Record<string, unknown>;
	if (rec.kind !== APP_BACKUP_KIND || rec.version !== APP_BACKUP_VERSION) return false;
	if (!isSrsBackup(rec.srs)) return false;
	const sessions = rec.sessions as Record<string, unknown> | null | undefined;
	if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) return false;
	if (sessions.version !== LAB_SESSION_VERSION) return false;
	if (!sessions.labs || typeof sessions.labs !== 'object' || Array.isArray(sessions.labs)) {
		return false;
	}
	return true;
}
