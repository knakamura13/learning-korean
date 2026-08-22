import { describe, expect, it } from 'vitest';
import { labCardState, type CourseLab, type CourseNavView } from './courseNav';
import { labPreviewModel, previewChipKind } from './labPreview';

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
	}
];

function view(partial: { ready?: boolean; unlocked?: string[] } = {}): CourseNavView {
	const unlocked = new Set(partial.unlocked ?? []);
	return {
		ready: partial.ready ?? true,
		isUnlocked: (tier) => unlocked.has(tier),
		sessionFor: () => undefined
	};
}

describe('labPreviewModel', () => {
	it('exposes title, standfirst, minutes, and an honest chip — never plate copy', () => {
		const firstVisit = view({ ready: false });
		const model = labPreviewModel(
			labs[0],
			'No reading ahead.',
			labCardState(labs[0], labs, firstVisit),
			null
		);
		expect(model.eyebrow).toMatch(/Lab 01/);
		expect(model.title).toBe('Find the Letters in Your Mouth');
		expect(model.standfirst).toBe('No reading ahead.');
		expect(model.minutes).toBe(9);
		expect(model.cardCount).toBe(17);
		expect(model.actionLabel).toMatch(/Open lab|Open anyway/);
		expect(model.chip).toMatch(/start here/);
		expect(model.accessibleName).toMatch(/Lab 01/);
		expect(JSON.stringify(model)).not.toMatch(/Colophon|ToC|folio|plate/i);
	});

	it('keeps Open anyway secondary and points the primary action at the prior lab', () => {
		const firstVisit = view({ ready: false });
		const model = labPreviewModel(
			labs[1],
			'Vowels next.',
			labCardState(labs[1], labs, firstVisit),
			labs[0]
		);
		expect(model.locked).toBe(true);
		expect(model.actionLabel).toBe('Open anyway');
		expect(model.chip).toMatch(/Needs Lab 01/);
		expect(model.priorId).toBe('0001');
		expect(model.priorActionLabel).toBe('Open Lab 01');
		expect(model).not.toHaveProperty('prerequisite');
	});

	it('covers every labCardState branch without a leftover kind', () => {
		const kinds = ['locked', 'resume', 'done', 'start', 'available'] as const;
		for (const kind of kinds) {
			const mapped = previewChipKind({
				locked: kind === 'locked',
				done: kind === 'done',
				resumeAt: kind === 'resume' ? 2 : null,
				startHere: kind === 'start'
			});
			expect(mapped).toBe(kind);
		}
	});

	it('archives a finished lab without a completed chip', () => {
		const after = view({ unlocked: ['lab01'] });
		const model = labPreviewModel(
			labs[0],
			'No reading ahead.',
			labCardState(labs[0], labs, after),
			null
		);
		expect(model.chipKind).toBe('done');
		expect(model.chip).toBe('');
		expect(model.priorId).toBeNull();
		expect(model.priorActionLabel).toBeNull();
		expect(model.accessibleName).toMatch(/completed/);
	});
});
