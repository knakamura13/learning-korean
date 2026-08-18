/**
 * What the Review route should show, and in which order.
 *
 * Daily sittings used to start with the standfirst and four stats — so the
 * card (the only thing that needs a keystroke) sat below the fold. Empty and
 * finished states still want that explanation; an active sitting does not.
 * Backup lives in the site footer, not here.
 */

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

/** Short enough to sit in a phone-width field; examples beat the word "romanization". */
export function reviewAnswerPlaceholder(kind: string): string {
	return kind === 'pron' ? 'han-gu-geo or 한구거' : 'g, eo, silent';
}
