/**
 * courseNav.ts — per-lab dashboard state, as pure data.
 *
 * Home paints each lab from `labCardState` flags (`startHere`, `resumeAt`,
 * `done`, `locked`). The rail uses `previewChipKind`, not a continue banner.
 * These helpers keep course order honest before and after hydration.
 */

import { resumable, type LabProgress } from './labSession';

export interface CourseLab {
	id: string;
	number: number;
	title: string;
	minutes: number;
	stepCount: number;
	unlocks: string;
	requires?: string;
}

export function toCourseLab(lab: {
	id: string;
	number: number;
	title: string;
	minutes: number;
	steps: { length: number };
	unlocks: string;
	requires?: string;
}): CourseLab {
	return {
		id: lab.id,
		number: lab.number,
		title: lab.title,
		minutes: lab.minutes,
		stepCount: lab.steps.length,
		unlocks: lab.unlocks,
		requires: lab.requires
	};
}

export interface LabCardState {
	/** Prerequisite not yet unlocked — not the primary action. */
	locked: boolean;
	done: boolean;
	/** 0-based index of the card to resume, when a sitting is in progress. */
	resumeAt: number | null;
	startHere: boolean;
}

export interface CourseNavView {
	/** True once local progress has been read. False is the prerender default. */
	ready: boolean;
	isUnlocked: (tier: string) => boolean;
	/** Skip-ahead grant — this lab is open even if the prerequisite is not. */
	isOpened?: (labId: string) => boolean;
	sessionFor: (labId: string) => LabProgress | undefined;
}

export function courseNavView(input: {
	ready: boolean;
	labs: CourseLab[];
	isUnlocked: (tier: string) => boolean;
	isOpened?: (labId: string) => boolean;
	sessionFor?: (labId: string) => LabProgress | undefined;
}): CourseNavView {
	const unlocked = new Set(
		input.labs.filter((lab) => input.isUnlocked(lab.unlocks)).map((lab) => lab.unlocks)
	);
	return {
		ready: input.ready,
		isUnlocked: (tier) => unlocked.has(tier),
		isOpened: input.isOpened,
		sessionFor: input.sessionFor ?? (() => undefined)
	};
}

function isDone(lab: CourseLab, view: Pick<CourseNavView, 'ready' | 'isUnlocked'>): boolean {
	return view.ready && view.isUnlocked(lab.unlocks);
}

function priorUnlocks(lab: CourseLab, labs: CourseLab[]): string | null {
	if (!lab.requires) return null;
	const prior = labs.find((item) => item.id === lab.requires);
	return prior?.unlocks ?? null;
}

function isBlocked(
	lab: CourseLab,
	labs: CourseLab[],
	view: Pick<CourseNavView, 'ready' | 'isUnlocked' | 'isOpened'>
): boolean {
	if (view.isOpened?.(lab.id)) return false;
	const needed = priorUnlocks(lab, labs);
	if (!needed) return false;
	// Before hydration, labs with a prerequisite render as locked — the
	// conservative default. A returning learner with them unlocked will see
	// the cards open after the client tick, which is a smaller lie than
	// showing later labs as available to a first-time visitor.
	if (!view.ready) return true;
	return !view.isUnlocked(needed);
}

function sessionResume(lab: CourseLab, view: CourseNavView): LabProgress | null {
	if (!view.ready) return null;
	return resumable(view.sessionFor(lab.id), lab.stepCount);
}

/** First lab that is neither finished, blocked, nor mid-sitting. */
export function nextLabId(labs: CourseLab[], view: CourseNavView): string | null {
	for (const lab of labs) {
		if (isDone(lab, view)) continue;
		if (isBlocked(lab, labs, view)) continue;
		if (sessionResume(lab, view)) continue;
		return lab.id;
	}
	return null;
}

/** True when every lab is finished and none is mid-sitting. */
export function courseComplete(labs: CourseLab[], view: CourseNavView): boolean {
	if (!view.ready || labs.length === 0) return false;
	return labs.every((lab) => labCardState(lab, labs, view).done);
}

export function labCardState(lab: CourseLab, labs: CourseLab[], view: CourseNavView): LabCardState {
	const resume = sessionResume(lab, view);
	const done = isDone(lab, view);
	const blocked = isBlocked(lab, labs, view);
	return {
		locked: blocked && !resume && !done,
		done: done && !resume,
		resumeAt: resume ? resume.nextIndex : null,
		startHere: nextLabId(labs, view) === lab.id
	};
}

export type ReviewPileBody = 'loading' | 'empty' | 'progress';

export type ReviewPileView = {
	body: ReviewPileBody;
	/** Cards the next sitting will present — the commitment the CTA promises. */
	sitting: number;
	/** Overdue cards that sitting will not reach. */
	backlog: number;
};

/**
 * Home Review pile: do not paint six locked rows and a color legend before
 * any family has unlocked. Both counts are 0 until progress has been read.
 *
 * The CTA quotes `sitting`, never the whole pile — see `reviewLoad.ts`.
 */
export function reviewPileView(
	ready: boolean,
	unlockedFamilies: number,
	sitting: number,
	backlog: number
): ReviewPileView {
	if (!ready) return { body: 'loading', sitting: 0, backlog: 0 };
	if (unlockedFamilies <= 0) return { body: 'empty', sitting: 0, backlog: 0 };
	return { body: 'progress', sitting: Math.max(0, sitting), backlog: Math.max(0, backlog) };
}

/** The next lab in course order after `currentId`, or null on the last lab. */
export function followingLab(labs: CourseLab[], currentId: string): CourseLab | null {
	const i = labs.findIndex((lab) => lab.id === currentId);
	if (i < 0 || i === labs.length - 1) return null;
	return labs[i + 1] ?? null;
}

export function requiredLab(labs: CourseLab[], requires: string | undefined): CourseLab | null {
	if (!requires) return null;
	return labs.find((lab) => lab.id === requires) ?? null;
}

/** True when this lab should show a "prerequisite first" banner. */
export function showPrerequisiteGate(
	lab: CourseLab,
	labs: CourseLab[],
	view: Pick<CourseNavView, 'ready' | 'isUnlocked' | 'isOpened'>
): boolean {
	return isBlocked(lab, labs, view) && !isDone(lab, view);
}
