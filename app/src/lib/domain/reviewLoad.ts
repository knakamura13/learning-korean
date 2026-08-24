/**
 * reviewLoad.ts — the two numbers that describe review work, and how to say them.
 *
 * `Stats.queue` counts everything the deck *could* serve today. A sitting is
 * capped (`reviewPerSitting`), so after a gap `queue` is several sittings'
 * worth — 162 where the sitting is 25. Printing `queue` as "due" therefore
 * overstated the commitment several times over at exactly the moment a
 * returning learner decides whether to bother, which is backwards for an app
 * whose governing constraint is a ten-minute sitting.
 *
 * So: `Stats.sitting` is the commitment and leads; `Stats.backlog` is context
 * and follows, with the reason it is held back. The nav badge, the Labs due
 * chip, the Review pile CTA / strip and the lab finish card all take their
 * wording from here so they cannot drift apart again.
 */

import { DEFAULT_REVIEW_PER_SITTING, type Stats } from './srs';

export interface ReviewLoadCopy {
	/** Visible action label — the commitment, never the debt. */
	action: string;
	/**
	 * Same commitment, worded for a second sitting after one is finished.
	 * "Check for more" hid the size of the next helping.
	 */
	moreAction: string;
	/**
	 * Accessible name for that action. Opens with `action` verbatim so the
	 * visible label stays a substring of the accessible name (WCAG 2.5.3).
	 */
	actionAria: string;
	/** Accessible name for the nav tab, whose visible label is just "Review". */
	navAria: string;
	/** Why the rest is held back, or null when nothing is. */
	backlogNote: string | null;
}

export type ReviewLoad = Pick<Stats, 'sitting' | 'backlog'>;

function cards(n: number): string {
	return n === 1 ? '1 card' : `${n} cards`;
}

export function reviewLoadCopy(
	load: ReviewLoad,
	reviewsPerSitting: number = DEFAULT_REVIEW_PER_SITTING
): ReviewLoadCopy {
	const action = `Review ${cards(load.sitting)}`;
	const moreAction = `Review ${load.sitting} more`;
	if (load.backlog <= 0) {
		return {
			action,
			moreAction,
			actionAria: action,
			navAria: `Review, ${cards(load.sitting)} in this sitting`,
			backlogNote: null
		};
	}
	const verb = load.backlog === 1 ? 'is' : 'are';
	return {
		action,
		moreAction,
		actionAria: `${action} — ${load.backlog} more waiting for a later sitting`,
		navAria: `Review, ${cards(load.sitting)} in this sitting, ${load.backlog} more waiting`,
		backlogNote:
			`${load.backlog} more ${verb} waiting — a sitting takes ${reviewsPerSitting} ` +
			`${reviewsPerSitting === 1 ? 'review' : 'reviews'} at a time, ` +
			`so a gap never turns into a long day.`
	};
}
