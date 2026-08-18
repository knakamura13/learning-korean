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

/** Short enough to sit in a phone-width field; examples beat the word "romanization". */
export function reviewAnswerPlaceholder(kind: string): string {
	return kind === 'pron' ? 'han-gu-geo or 한구거' : 'g, eo, silent';
}
