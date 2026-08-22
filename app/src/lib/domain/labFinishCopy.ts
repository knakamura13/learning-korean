import { DEFAULT_NEW_PER_DAY, type Stats } from './srs';

export type LabFinishCopy = {
	lead: string;
	detail: string;
};

function cards(n: number): string {
	return n === 1 ? '1 card' : `${n} cards`;
}

/**
 * Finish-screen copy for the review handoff. Distinguishes cards just
 * unlocked from what the next sitting will actually present.
 *
 * This used to quote `Stats.queue` as "due today" in the same breath as the
 * daily cap that holds most of it back — "162 are due today (daily new-card
 * cap of 10)" contradicted itself. It quotes `Stats.sitting` now, with the
 * backlog named separately. See `reviewLoad.ts`.
 */
export function labFinishCopy(
	released: number,
	stats: Pick<Stats, 'sitting' | 'backlog' | 'newLeft' | 'unseen'>,
	newPerDay = DEFAULT_NEW_PER_DAY
): LabFinishCopy {
	const sitting =
		stats.sitting === 0
			? 'Nothing is due right now'
			: `Your next sitting is ${cards(stats.sitting)}`;
	const rest =
		stats.backlog > 0 ? `, with ${stats.backlog} more waiting after it` : '';

	if (released <= 0) {
		return {
			lead: 'These cards are already in Review.',
			detail: `${sitting}${rest}.`
		};
	}

	const unlocked = released === 1 ? '1 card unlocked.' : `${released} cards unlocked.`;
	const capped = stats.unseen > stats.newLeft || released > stats.newLeft;

	return {
		lead: unlocked,
		detail: capped
			? `${sitting}${rest} — new cards enter ${newPerDay} a day, so the rest arrive as the cap allows.`
			: `${sitting}${rest}.`
	};
}
