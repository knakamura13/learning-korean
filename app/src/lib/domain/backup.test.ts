import { describe, expect, it } from 'vitest';
import { emptySessions } from './labSession';
import {
	APP_BACKUP_KIND,
	APP_BACKUP_VERSION,
	backupFilename,
	exportedStatus,
	importedStatus,
	storageNeedsBackup,
	unwrapImport,
	wrapExport
} from './backup';

const srsV1 = {
	version: 1 as const,
	unlocked: ['lab01'],
	openedLabs: [],
	cards: {},
	days: {},
	newDate: '',
	newCount: 0,
	newIds: []
};

describe('backupFilename', () => {
	it('pads month and day and sorts chronologically as a string', () => {
		const jan = new Date(2026, 0, 3).getTime();
		expect(backupFilename(jan)).toBe('korean-progress-2026-01-03.json');
	});

	it('uses the local calendar date', () => {
		const dec = new Date(2026, 11, 25).getTime();
		expect(backupFilename(dec)).toBe('korean-progress-2026-12-25.json');
	});
});

describe('exportedStatus', () => {
	it('names the file and is the "right" tone', () => {
		const status = exportedStatus('korean-progress-2026-01-03.json');
		expect(status.tone).toBe('right');
		expect(status.message).toContain('korean-progress-2026-01-03.json');
		expect(status.message).not.toMatch(/whole review history/);
		expect(status.message).toMatch(/lab/i);
	});
});

describe('importedStatus', () => {
	it('reports success without alarming wording', () => {
		expect(importedStatus(true)).toEqual({
			tone: 'right',
			message: 'Progress restored from that backup.'
		});
	});

	it('reports failure and states nothing was changed', () => {
		const status = importedStatus(false);
		expect(status.tone).toBe('wrong');
		expect(status.message).toMatch(/nothing was changed/);
	});
});

describe('wrapExport / unwrapImport', () => {
	it('wraps a valid SRS document with lab sessions', () => {
		const sessions = emptySessions();
		const packed = wrapExport(JSON.stringify(srsV1), sessions);
		const parsed = JSON.parse(packed) as {
			kind: string;
			version: number;
			srs: typeof srsV1;
			sessions: typeof sessions;
		};
		expect(parsed.kind).toBe(APP_BACKUP_KIND);
		expect(parsed.version).toBe(APP_BACKUP_VERSION);
		expect(parsed.srs).toEqual(srsV1);
		expect(parsed.sessions).toEqual(sessions);
	});

	it('exports only kind, version, srs, and sessions keys', () => {
		const packed = wrapExport(JSON.stringify(srsV1), emptySessions());
		expect(Object.keys(JSON.parse(packed) as object).sort()).toEqual([
			'kind',
			'sessions',
			'srs',
			'version'
		]);
	});

	it('ignores extra look and theme fields on unwrapImport', () => {
		const sessions = emptySessions();
		const withExtras = JSON.stringify({
			kind: APP_BACKUP_KIND,
			version: APP_BACKUP_VERSION,
			srs: srsV1,
			sessions,
			look: 'taegeuk',
			theme: 'dark'
		});
		expect(unwrapImport(withExtras)).toEqual({
			srsText: JSON.stringify(srsV1),
			sessions
		});
	});

	it('leaves a corrupt unread blob unwrapped so restore can still save it', () => {
		expect(wrapExport('{not-json', emptySessions())).toBe('{not-json');
	});

	it('unwraps a v2 envelope and a legacy SRS-only file', () => {
		const sessions = { version: 1 as const, labs: { lab01: { nextIndex: 2, firstTry: 1, elapsedMs: 10, finished: false, outcomes: [null, null] } } };
		const v2 = unwrapImport(wrapExport(JSON.stringify(srsV1), sessions));
		expect(v2).toEqual({ srsText: JSON.stringify(srsV1), sessions });

		const v1 = unwrapImport(JSON.stringify(srsV1));
		expect(v1).toEqual({ srsText: JSON.stringify(srsV1), sessions: null });

		expect(unwrapImport('{"nope":true}')).toBeNull();
		expect(unwrapImport('not json')).toBeNull();
	});

	it('does not wrap JSON that is not an SRS document', () => {
		expect(wrapExport('{"foo":1}', emptySessions())).toBe('{"foo":1}');
		expect(
			unwrapImport(
				JSON.stringify({
					kind: APP_BACKUP_KIND,
					version: APP_BACKUP_VERSION,
					srs: { nope: true },
					sessions: emptySessions()
				})
			)
		).toBeNull();
	});
});

describe('storageNeedsBackup', () => {
	it('opens the backup fold when either store is not durable or SRS is unreadable', () => {
		expect(storageNeedsBackup(true, true, false)).toBe(false);
		expect(storageNeedsBackup(false, true, false)).toBe(true);
		expect(storageNeedsBackup(true, false, false)).toBe(true);
		expect(storageNeedsBackup(true, true, true)).toBe(true);
	});
});
