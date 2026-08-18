/**
 * advancePick.ts — how choice and read cards resolve a pick.
 *
 * A correct pick settles and shows the teaching. A wrong pick nudges
 * without revealing the answer, so the learner can try again.
 */

export interface AdvanceTeach {
	teach: string;
	miss?: string;
}

export type ChoicePickResult =
	| { action: 'settle'; correct: true }
	| { action: 'nudge'; html: string };

/** Shown when a wrong pick has no authored miss hint. Must not name the answer. */
export const CHOICE_RETRY_COPY = '<p>Not that one. Try another option.</p>';

export function resolveChoicePick(correct: boolean, step: AdvanceTeach): ChoicePickResult {
	if (correct) return { action: 'settle', correct: true };
	return { action: 'nudge', html: step.miss ?? CHOICE_RETRY_COPY };
}
