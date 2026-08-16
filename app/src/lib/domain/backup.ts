/**
 * backup.ts — filename and status copy for the progress export/import
 * control, kept pure so the format is testable without mounting a
 * component or touching localStorage.
 *
 * Why this exists: `progress.export()` / `progress.import()` have existed
 * since the SRS rewrite as "the escape hatch" for a documented storage
 * risk (see NOTES.md — localStorage is unreliable on some origins), but no
 * route ever called them. A learner whose deck lives only in one browser
 * has no way to move it to a new device or recover it after clearing site
 * data. This module backs the UI that finally wires that escape hatch up.
 */

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
		message: `Saved ${filename} — keep it somewhere safe, it is your whole review history.`
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
