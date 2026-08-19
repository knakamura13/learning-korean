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
import type { LabSessions } from './labSession';

export const APP_BACKUP_KIND = 'korean-progress';
export const APP_BACKUP_VERSION = 2 as const;

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

export function importedStatus(ok: boolean): BackupStatus {
	return ok
		? { tone: 'right', message: 'Progress restored from that backup.' }
		: {
				tone: 'wrong',
				message: "That file doesn't look like a Korean progress backup — nothing was changed."
			};
}

export function storageNeedsBackup(
	progressDurable: boolean,
	labDurable: boolean,
	corrupt: boolean
): boolean {
	return !progressDurable || !labDurable || corrupt;
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

function isAppBackup(
	raw: unknown
): raw is { kind: string; version: number; srs: unknown; sessions: unknown } {
	if (!raw || typeof raw !== 'object') return false;
	const rec = raw as Record<string, unknown>;
	return rec.kind === APP_BACKUP_KIND && rec.version === APP_BACKUP_VERSION && isSrsBackup(rec.srs);
}
