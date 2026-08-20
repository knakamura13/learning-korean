/**
 * labPreview.ts — chip copy and models for the 01–06 lab rail preview.
 *
 * Hover placement lives in hoverPlacement.ts (Labs and Reference rails share
 * it). Chip kinds follow `labCardState` so the preview never invents a status
 * the home cards would not show.
 */

import { labCardState, type CourseLab, type CourseNavView, type LabCardState } from './courseNav';

export type PreviewChipKind = 'locked' | 'resume' | 'done' | 'start' | 'available';

export interface LabPreviewModel {
	id: string;
	href: string;
	numberLabel: string;
	eyebrow: string;
	title: string;
	standfirst: string;
	minutes: number;
	cardCount: number;
	chip: string;
	chipKind: PreviewChipKind;
	actionLabel: 'Open lab' | 'Open anyway';
	/** When locked, the honest primary action is the prerequisite lab. */
	priorId: string | null;
	priorActionLabel: string | null;
	accessibleName: string;
	locked: boolean;
}

function padLab(n: number): string {
	return String(n).padStart(2, '0');
}

export function previewChipKind(state: LabCardState): PreviewChipKind {
	if (state.locked) return 'locked';
	if (state.resumeAt !== null) return 'resume';
	if (state.done) return 'done';
	if (state.startHere) return 'start';
	return 'available';
}

function chipCopy(
	kind: PreviewChipKind,
	lab: CourseLab,
	state: LabCardState,
	prior: CourseLab | null
): { chip: string; actionLabel: 'Open lab' | 'Open anyway'; statusPhrase: string } {
	switch (kind) {
		case 'locked':
			return {
				chip: prior ? `Needs Lab ${padLab(prior.number)}` : 'Locked',
				actionLabel: 'Open anyway',
				statusPhrase: 'locked'
			};
		case 'resume':
			return {
				chip: `resume · card ${(state.resumeAt ?? 0) + 1} of ${lab.stepCount}`,
				actionLabel: 'Open lab',
				statusPhrase: 'resume'
			};
		case 'done':
			return {
				chip: '',
				actionLabel: 'Open lab',
				statusPhrase: 'completed'
			};
		case 'start':
			return {
				chip: 'start here',
				actionLabel: 'Open lab',
				statusPhrase: 'start here'
			};
		case 'available':
			return {
				chip: '',
				actionLabel: 'Open lab',
				statusPhrase: 'available'
			};
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

export function labPreviewModel(
	lab: CourseLab,
	standfirst: string,
	state: LabCardState,
	prior: CourseLab | null
): LabPreviewModel {
	const kind = previewChipKind(state);
	const copy = chipCopy(kind, lab, state, prior);
	const numberLabel = padLab(lab.number);
	const eyebrow = `Lab ${numberLabel}`;
	return {
		id: lab.id,
		href: `/lab/${lab.id}`,
		numberLabel,
		eyebrow,
		title: lab.title,
		standfirst,
		minutes: lab.minutes,
		cardCount: lab.stepCount,
		chip: copy.chip,
		chipKind: kind,
		actionLabel: copy.actionLabel,
		priorId: kind === 'locked' ? (prior?.id ?? null) : null,
		priorActionLabel: kind === 'locked' && prior ? `Open Lab ${padLab(prior.number)}` : null,
		accessibleName: `${eyebrow}, ${lab.title}, ${copy.statusPhrase}`,
		locked: kind === 'locked'
	};
}

export function labPreviewModels(
	labs: CourseLab[],
	standfirsts: Record<string, string>,
	view: CourseNavView,
	required: (requires: string | undefined) => CourseLab | null
): LabPreviewModel[] {
	return labs.map((lab) =>
		labPreviewModel(lab, standfirsts[lab.id] ?? '', labCardState(lab, labs, view), required(lab.requires))
	);
}
