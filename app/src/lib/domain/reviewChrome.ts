/**
 * What the Review route should show, and in which order.
 *
 * Daily sittings used to start with the standfirst, a backup disclosure, and
 * four stats — so the card (the only thing that needs a keystroke) sat below
 * the fold. Empty and finished states still want that explanation; an active
 * sitting does not.
 */

export type ReviewChrome = {
	showStandfirst: boolean;
	showStats: boolean;
	showBackup: boolean;
	/** Urgent: storage will not last, so backup stays above the card. */
	backupFirst: boolean;
};

export function reviewChrome(input: {
	ready: boolean;
	durable: boolean;
	unlocked: number;
	inSession: boolean;
}): ReviewChrome {
	const showBackup = input.ready && (!input.durable || input.unlocked > 0);
	return {
		showStandfirst: !input.inSession,
		showStats: input.ready && input.unlocked > 0 && !input.inSession,
		showBackup,
		backupFirst: showBackup && !input.durable
	};
}

/** Short enough to sit in a phone-width field; examples beat the word "romanization". */
export function reviewAnswerPlaceholder(kind: string): string {
	return kind === 'pron' ? 'han-gu-geo or 한구거' : 'g, eo, silent';
}
