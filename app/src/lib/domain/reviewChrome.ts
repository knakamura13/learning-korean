/**
 * What the Review route should show, and in which order.
 *
 * Daily sittings used to start with the standfirst and four stats — so the
 * card (the only thing that needs a keystroke) sat below the fold. Empty and
 * finished states still want that explanation; an active sitting does not.
 * Backup lives on Settings (`/settings#backup`), not here.
 */

import { RELEARN_MS } from './srs';

export type ReviewChrome = {
	showStandfirst: boolean;
	showStats: boolean;
};

export type ReviewBody = 'loading' | 'locked' | 'sitting' | 'check-for-more' | 'clear';

export function reviewChrome(input: {
	ready: boolean;
	unlocked: number;
	inSession: boolean;
}): ReviewChrome {
	return {
		showStandfirst: !input.inSession,
		showStats: input.ready && input.unlocked > 0 && !input.inSession
	};
}

/**
 * After a sitting, "Check for more" is only for leftover due cards.
 * Otherwise the empty state is "Review is clear" — never both.
 */
export function reviewBody(input: {
	ready: boolean;
	unlocked: number;
	sittingLength: number;
	index: number;
	remainingDue: number;
}): ReviewBody {
	if (!input.ready) return 'loading';
	if (input.unlocked === 0) return 'locked';
	const finished = input.sittingLength > 0 && input.index >= input.sittingLength;
	if (finished) return input.remainingDue > 0 ? 'check-for-more' : 'clear';
	if (input.sittingLength === 0) return 'clear';
	return 'sitting';
}

/** Caps how far a sitting-miss requeue can grow this session. */
export const MAX_SITTING_LENGTH = 60;

/**
 * Interval copy after a grade. `ivl === 0` is the relearn window (`RELEARN_MS`),
 * not a handwritten "10 minutes".
 */
export function reviewIntervalCopy(ivl: number, relearnMs: number = RELEARN_MS): string {
	if (ivl === 0) {
		const minutes = Math.max(1, Math.round(relearnMs / 60_000));
		return `again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
	}
	if (ivl < 2) return 'again in 1 day';
	return `again in ${Math.round(ivl)} days`;
}

/**
 * A missed card returns at the end of this sitting, once, until the cap.
 * Identity matches `lastIndexOf`: already-queued copies do not grow the pile.
 */
export function sittingQueueAfterGrade<T>(queue: T[], index: number, missed: boolean): T[] {
	if (!missed) return queue;
	if (queue.length >= MAX_SITTING_LENGTH) return queue;
	const card = queue[index];
	if (card === undefined) return queue;
	if (queue.lastIndexOf(card) !== index) return queue;
	return [...queue, card];
}

/** Caps the Review field. Longer than every accepted deck answer, including Hangul. */
export const REVIEW_ANSWER_MAX_LENGTH = 64;

/** Short enough to sit in a phone-width field; examples beat the word "romanization". */
export function reviewAnswerPlaceholder(kind: string): string {
	return kind === 'pron' ? 'han-gu-geo or 한구거' : 'g, eo, silent';
}
