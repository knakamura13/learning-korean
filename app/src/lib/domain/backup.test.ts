import { describe, expect, it } from 'vitest';
import { backupFilename, exportedStatus, importedStatus } from './backup';

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
