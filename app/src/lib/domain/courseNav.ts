/**
 * courseNav.ts — what the dashboard should offer next, as pure data.
 *
 * The homepage used to paint every lab as an equally clickable card and only
 * decorate later ones with "finish Lab N first". That copy is a lie if the
 * card is still a link, and it is invisible in prerendered HTML because
 * status waited on hydration. These helpers pick one continue action and an
 * honest per-lab state so the UI can match the course order.
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

export interface ContinueAction {
	kind: 'start' | 'resume' | 'review' | 'caught-up';
	href: string;
	kicker: string;
	title: string;
	detail: string;
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
	sessionFor: (labId: string) => LabProgress | undefined;
	queue: number;
}

function padLab(n: number): string {
	return String(n).padStart(2, '0');
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
	view: Pick<CourseNavView, 'ready' | 'isUnlocked'>
): boolean {
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

export function labCardState(lab: CourseLab, labs: CourseLab[], view: CourseNavView): LabCardState {
	const resume = sessionResume(lab, view);
	const done = isDone(lab, view);
	const blocked = isBlocked(lab, labs, view);
	return {
		locked: blocked && !resume,
		done: done && !resume,
		resumeAt: resume ? resume.nextIndex : null,
		startHere: nextLabId(labs, view) === lab.id
	};
}

/**
 * The single next thing to do. Resume beats review so a 10-minute sitting is
 * not abandoned for the deck; review beats starting a new lab so newly
 * unlocked cards get their first look before the next lesson.
 */
export function continueAction(labs: CourseLab[], view: CourseNavView): ContinueAction | null {
	if (labs.length === 0) return null;

	for (const lab of labs) {
		const resume = sessionResume(lab, view);
		if (!resume) continue;
		return {
			kind: 'resume',
			href: `/lab/${lab.id}`,
			kicker: 'Continue',
			title: `Resume Lab ${padLab(lab.number)}`,
			detail: `Card ${resume.nextIndex + 1} of ${lab.stepCount} · ${lab.title}`
		};
	}

	if (view.ready && view.queue > 0) {
		return {
			kind: 'review',
			href: '/review',
			kicker: 'Due today',
			title: `Review ${view.queue} card${view.queue === 1 ? '' : 's'}`,
			detail: 'Type the sound. The clock grades hesitation, not just accuracy.'
		};
	}

	const nextId = nextLabId(labs, view);
	const next = labs.find((lab) => lab.id === nextId);
	if (next) {
		return {
			kind: 'start',
			href: `/lab/${next.id}`,
			kicker: next.number === 1 ? 'Start here' : 'Next lab',
			title: `Start Lab ${padLab(next.number)}`,
			detail: `~${next.minutes} min · ${next.title}`
		};
	}

	if (!view.ready) return null;

	return {
		kind: 'caught-up',
		href: '/review',
		kicker: 'Caught up',
		title: 'Deck is clear',
		detail: 'Nothing is due. Open the deck if you want to check.'
	};
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
	view: Pick<CourseNavView, 'ready' | 'isUnlocked'>
): boolean {
	return isBlocked(lab, labs, view);
}
