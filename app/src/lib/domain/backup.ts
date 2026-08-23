/**
 * backup.ts — filename, status copy, and the versioned export envelope.
 *
 * Why this exists: `progress.export()` / `progress.import()` have existed
 * since the SRS rewrite as "the escape hatch" for a documented storage
 * risk (see NOTES.md — localStorage is unreliable on some origins), but no
 * route ever called them. A learner whose deck lives only in one browser
 * has no way to move it to a new device or recover it after clearing site
 * data. This module backs the UI that finally wires that escape hatch up.
 *
 * v1 files are a raw SRS document. v2 wraps that document with lab place
 * so a restore does not drop an in-progress sitting.
 */

import { isSrsBackup } from './srs';
import { emptySessions, sessionsFromBackup, type LabSessions } from './labSession';

export const APP_BACKUP_KIND = 'korean-progress';
export const APP_BACKUP_VERSION = 2 as const;
/** Reject restore payloads before parse / FileReader work. */
export const MAX_BACKUP_BYTES = 200_000;

export function backupFilename(now: number): string {
	const d = new Date(now);
	const pad = (n: number) => String(n).padStart(2, '0');
	const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	return `korean-progress-${stamp}.json`;
}

export interface BackupStatus {
	tone: 'right' | 'wrong';
	message: string;
}

export function exportedStatus(filename: string): BackupStatus {
	return {
		tone: 'right',
		message: `Saved ${filename} — keep it somewhere safe. It holds your review deck and any lab in progress.`
	};
}

export type ImportFailReason = 'invalid' | 'too-large';

export function importedStatus(ok: boolean, reason: ImportFailReason = 'invalid'): BackupStatus {
	if (ok) return { tone: 'right', message: 'Progress restored from that backup.' };
	if (reason === 'too-large') {
		return {
			tone: 'wrong',
			message: 'That file is too large to restore — nothing was changed.'
		};
	}
	return {
		tone: 'wrong',
		message: "That file doesn't look like a Korean progress backup — nothing was changed."
	};
}

export function wrapExport(srsText: string, sessions: LabSessions): string {
	try {
		const srs = JSON.parse(srsText) as unknown;
		if (!isSrsBackup(srs)) return srsText;
		return JSON.stringify(
			{ kind: APP_BACKUP_KIND, version: APP_BACKUP_VERSION, srs, sessions },
			null,
			2
		);
	} catch {
		return srsText;
	}
}

export function unwrapImport(
	json: string
): { srsText: string; sessions: unknown | null } | null {
	if (json.length > MAX_BACKUP_BYTES) return null;
	try {
		const parsed = JSON.parse(json) as unknown;
		if (isAppBackup(parsed)) {
			return { srsText: JSON.stringify(parsed.srs), sessions: parsed.sessions };
		}
		if (isSrsBackup(parsed)) {
			return { srsText: json, sessions: null };
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Validate a restore file and build the sitting map to write. v1 SRS-only
 * files clear lab place. A v2 envelope with an unrevivable known lab fails
 * closed so SRS is not imported first.
 */
export function applyImportedBackup(
	json: string,
	stepCounts: Record<string, number>
): { srsText: string; sessions: LabSessions } | null {
	const unpacked = unwrapImport(json);
	if (!unpacked) return null;
	if (unpacked.sessions === null) {
		return { srsText: unpacked.srsText, sessions: emptySessions() };
	}
	const sessions = sessionsFromBackup(unpacked.sessions, stepCounts);
	if (!sessions) return null;
	return { srsText: unpacked.srsText, sessions };
}

function isAppBackup(
	raw: unknown
): raw is { kind: string; version: number; srs: unknown; sessions: unknown } {
	if (!raw || typeof raw !== 'object') return false;
	const rec = raw as Record<string, unknown>;
	return (
		rec.kind === APP_BACKUP_KIND &&
		rec.version === APP_BACKUP_VERSION &&
		isSrsBackup(rec.srs) &&
		'sessions' in rec
	);
}
