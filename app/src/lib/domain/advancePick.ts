/**
 * advancePick.ts — how choice and read cards settle a pick.
 *
 * Those cards always advance: the teaching is in the explanation, not in
 * retrying. A wrong pick must still say so — otherwise the options go red
 * while the verdict says "Yes".
 */

export interface AdvanceTeach {
	teach: string;
	miss?: string;
}

export interface AdvanceSettle {
	overrideTeach?: string;
	correct: boolean;
}

export function settleAdvancePick(correct: boolean, step: AdvanceTeach): AdvanceSettle {
	if (correct) return { correct: true };
	return { overrideTeach: step.miss ?? step.teach, correct: false };
}
