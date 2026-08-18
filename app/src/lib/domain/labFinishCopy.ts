import { DEFAULT_NEW_PER_DAY, type Stats } from './srs';

export type LabFinishCopy = {
	lead: string;
	detail: string;
};

/**
 * Finish-screen copy for the review handoff. Distinguishes cards just unlocked
 * from what is actually due today (daily new-card cap and leftover reviews).
 */
export function labFinishCopy(
	released: number,
	stats: Pick<Stats, 'queue' | 'newLeft' | 'unseen'>,
	newPerDay = DEFAULT_NEW_PER_DAY
): LabFinishCopy {
	const waiting =
		stats.queue === 1 ? '1 waiting' : `${stats.queue} waiting`;

	if (released <= 0) {
		return {
			lead: 'These cards are already in Review.',
			detail: `You have ${waiting}.`
		};
	}

	const unlocked =
		released === 1 ? '1 card unlocked.' : `${released} cards unlocked.`;
	const dueToday =
		stats.queue === 1 ? '1 is due today' : `${stats.queue} are due today`;
	const capped = stats.unseen > stats.newLeft || released > stats.newLeft;

	if (capped) {
		return {
			lead: unlocked,
			detail: `${dueToday} (daily new-card cap of ${newPerDay}). The rest enter as the cap allows.`
		};
	}

	return {
		lead: unlocked,
		detail: `You have ${waiting}.`
	};
}
