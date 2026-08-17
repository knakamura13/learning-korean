/**
 * plateCatalog.ts — 01–06 rail state. Sequence is catalog numbers, not tabs.
 */

import { labCardState, type CourseLab, type CourseNavView } from './courseNav';
import type { ContinueAction } from './courseNav';
import { padFolio } from './sitting';

export type PlateTone = 'locked' | 'done' | 'current' | 'in-progress' | 'due' | 'start';

export interface PlateView {
	id: string;
	number: number;
	label: string;
	title: string;
	href: string;
	tone: PlateTone;
	locked: boolean;
	tooltip: string;
}

export function plateTooltip(tone: PlateTone): string {
	switch (tone) {
		case 'locked':
			return 'Locked. Finish the previous plate first. The sequence is the pedagogy.';
		case 'start':
			return 'Start here — the next derivation.';
		case 'in-progress':
		case 'due':
			return 'Unfinished or due — this sitting is hot.';
		case 'done':
			return 'Read this plate again';
		case 'current':
			return 'This sitting.';
		default: {
			const _exhaustive: never = tone;
			return _exhaustive;
		}
	}
}

function highestCompletedNumber(labs: CourseLab[], view: CourseNavView): number | null {
	let highest: number | null = null;
	for (const lab of labs) {
		const card = labCardState(lab, labs, view);
		if (card.done) highest = lab.number;
	}
	return highest;
}

export function plateViews(
	labs: CourseLab[],
	view: CourseNavView,
	opts: {
		currentLabId: string | null;
		sittingKind: ContinueAction['kind'] | null;
	}
): PlateView[] {
	const dueNumber =
		opts.sittingKind === 'review' ? highestCompletedNumber(labs, view) : null;

	return labs.map((lab) => {
		const card = labCardState(lab, labs, view);
		let tone: PlateTone;
		if (card.locked) {
			tone = 'locked';
		} else if (opts.currentLabId === lab.id) {
			tone = 'current';
		} else if (card.resumeAt !== null) {
			tone = 'in-progress';
		} else if (dueNumber === lab.number) {
			tone = 'due';
		} else if (card.done) {
			tone = 'done';
		} else if (card.startHere) {
			tone = 'start';
		} else {
			tone = 'start';
		}

		return {
			id: lab.id,
			number: lab.number,
			label: padFolio(lab.number),
			title: lab.title,
			href: `/lab/${lab.id}`,
			tone,
			locked: card.locked,
			tooltip: plateTooltip(tone)
		};
	});
}
