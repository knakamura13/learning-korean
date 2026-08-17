import { describe, expect, it } from 'vitest';
import { type CourseLab, type CourseNavView } from './courseNav';
import { emptyOutcomes } from './pipState';
import type { LabProgress } from './labSession';
import { plateViews } from './plateCatalog';

const labs: CourseLab[] = [
	{
		id: '0001',
		number: 1,
		title: 'Find the Letters in Your Mouth',
		minutes: 9,
		stepCount: 17,
		unlocks: 'lab01'
	},
	{
		id: '0002',
		number: 2,
		title: 'Ten Vowels From Two Strokes',
		minutes: 9,
		stepCount: 16,
		unlocks: 'lab02',
		requires: '0001'
	},
	{
		id: '0003',
		number: 3,
		title: 'Eleven Compounds, Seven Sounds',
		minutes: 9,
		stepCount: 16,
		unlocks: 'lab03',
		requires: '0002'
	}
];

function view(partial: {
	ready?: boolean;
	unlocked?: string[];
	sessions?: Record<string, LabProgress>;
	queue?: number;
}): CourseNavView {
	const unlocked = new Set(partial.unlocked ?? []);
	return {
		ready: partial.ready ?? true,
		isUnlocked: (tier) => unlocked.has(tier),
		sessionFor: (id) => partial.sessions?.[id],
		queue: partial.queue ?? 0
	};
}

describe('plateViews', () => {
	it('locks later plates before hydration', () => {
		const plates = plateViews(labs, view({ ready: false }), {
			currentLabId: null,
			sittingKind: 'start'
		});
		expect(plates[0].tone).toBe('start');
		expect(plates[1].locked).toBe(true);
		expect(plates[2].locked).toBe(true);
	});

	it('marks the mounted lab current and a mid-sitting moss in-progress', () => {
		const plates = plateViews(
			labs,
			view({
				unlocked: ['lab01'],
				sessions: {
					'0002': {
						nextIndex: 4,
						firstTry: 1,
						elapsedMs: 1,
						finished: false,
						outcomes: emptyOutcomes(16)
					}
				}
			}),
			{ currentLabId: '0002', sittingKind: 'resume' }
		);
		expect(plates[0].tone).toBe('done');
		expect(plates[1].tone).toBe('current');
		expect(plates[2].locked).toBe(true);
	});

	it('puts rose on the highest completed plate during a review sitting', () => {
		const plates = plateViews(labs, view({ unlocked: ['lab01', 'lab02'], queue: 12 }), {
			currentLabId: null,
			sittingKind: 'review'
		});
		expect(plates[0].tone).toBe('done');
		expect(plates[1].tone).toBe('due');
		expect(plates[2].locked).toBe(false);
		expect(plates[2].tone).toBe('start');
	});
});
