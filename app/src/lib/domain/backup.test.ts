import { describe, expect, it } from 'vitest';
import { emptySessions } from './labSession';
import {
	APP_BACKUP_KIND,
	APP_BACKUP_VERSION,
	MAX_BACKUP_BYTES,
	applyImportedBackup,
	backupFilename,
	exportedStatus,
	importedStatus,
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
		expect(status.message).toMatch(/doesn't look like/);
	});

	it('names the actual reject reason when the file is too large', () => {
		const status = importedStatus(false, 'too-large');
		expect(status.tone).toBe('wrong');
		expect(status.message).toMatch(/too large/);
		expect(status.message).toMatch(/nothing was changed/);
		expect(status.message).not.toMatch(/doesn't look like/);
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

	it('rejects an envelope larger than MAX_BACKUP_BYTES', () => {
		expect(unwrapImport('{"version":1,'.padEnd(MAX_BACKUP_BYTES + 1, 'x'))).toBeNull();
	});
});

const COUNTS = { '0001': 17 };

describe('applyImportedBackup', () => {
	it('clears lab sittings when restoring a v1 SRS-only file', () => {
		const plan = applyImportedBackup(JSON.stringify(srsV1), COUNTS);
		expect(plan).toEqual({ srsText: JSON.stringify(srsV1), sessions: emptySessions() });
	});

	it('keeps v2 sittings that revive', () => {
		const sitting = {
			version: 1 as const,
			labs: {
				'0001': { nextIndex: 2, firstTry: 1, elapsedMs: 10, finished: false, outcomes: [null, null] }
			}
		};
		const packed = wrapExport(JSON.stringify(srsV1), sitting);
		const plan = applyImportedBackup(packed, COUNTS);
		expect(plan?.sessions.labs['0001']?.nextIndex).toBe(2);
	});

	it('fails closed when v2 names a known lab whose payload cannot revive', () => {
		const packed = JSON.stringify({
			kind: APP_BACKUP_KIND,
			version: APP_BACKUP_VERSION,
			srs: srsV1,
			sessions: { version: 1, labs: { '0001': { nextIndex: -1 } } }
		});
		expect(applyImportedBackup(packed, COUNTS)).toBeNull();
	});
});
