/**
 * sitting.ts — display copy for the fascicle article, derived from continueAction.
 * Pedagogy and priority stay in courseNav; this file only names the sitting.
 */

import type { ContinueAction } from './courseNav';

export type FolioPip = 'moss' | 'rose' | 'good';

export function padFolio(n: number): string {
	return String(n).padStart(2, '0');
}

export function stripInstructionHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function folioPip(kind: ContinueAction['kind']): FolioPip {
	switch (kind) {
		case 'resume':
		case 'review':
			return 'rose';
		case 'start':
			return 'moss';
		case 'caught-up':
			return 'good';
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

export function folioPipTooltip(kind: ContinueAction['kind']): string {
	switch (kind) {
		case 'start':
			return 'Start here — the next derivation.';
		case 'resume':
		case 'review':
			return 'Unfinished or due — this sitting is hot.';
		case 'caught-up':
			return 'Nothing is due.';
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

export type FolioMode =
	| { mode: 'lab'; labNumber: number; card: number; total: number }
	| { mode: 'due'; queue: number }
	| { mode: 'clear' };

export function folioText(input: FolioMode): string {
	switch (input.mode) {
		case 'lab':
			return `${padFolio(input.labNumber)} · ${padFolio(input.card)}/${padFolio(input.total)}`;
		case 'due':
			return `DUE ${input.queue}`;
		case 'clear':
			return 'CLEAR';
		default: {
			const _exhaustive: never = input;
			return _exhaustive;
		}
	}
}

export function sittingCtaLabel(action: ContinueAction): string {
	switch (action.kind) {
		case 'start':
			return action.title;
		case 'resume':
			return 'Resume the sitting';
		case 'review':
			return 'Begin the review';
		case 'caught-up':
			return 'Open the deck anyway';
		default: {
			const _exhaustive: never = action.kind;
			return _exhaustive;
		}
	}
}

export const TITLE_PAGE_KICKER = 'Fascicle — reading Hangul';
export const TITLE_PAGE_LEAD =
	'Six labs. Derive the writing system. Then the deck quizzes only what you have unlocked.';
export const STORAGE_BLOCKED_LEAD =
	'This browser will not keep a record. You can still sit; progress will not persist.';
export const CAUGHT_UP_WELL = 'The gap is doing the work.';
export const EMPTY_WELL_CAPTION = 'Figure will appear when the sitting begins.';

export interface SittingCopy {
	kicker: string;
	title: string;
	lead: string;
	cta: string;
}

export function sittingCopy(
	action: ContinueAction,
	opts: {
		titlePage: boolean;
		storageBlocked: boolean;
		resumeLead: string | null;
	}
): SittingCopy {
	const kicker = opts.titlePage ? TITLE_PAGE_KICKER : action.kicker;
	let lead: string;
	if (opts.storageBlocked) {
		lead = STORAGE_BLOCKED_LEAD;
	} else if (opts.titlePage) {
		lead = TITLE_PAGE_LEAD;
	} else if (action.kind === 'resume' && opts.resumeLead) {
		lead = opts.resumeLead;
	} else {
		lead = action.detail;
	}
	return {
		kicker,
		title: opts.titlePage ? 'Korean' : action.title,
		lead,
		cta: sittingCtaLabel(action)
	};
}

export function labIdFromPath(pathname: string): string | null {
	const match = pathname.match(/\/lab\/(\d+)/);
	return match?.[1] ?? null;
}

export function isTitlePage(args: {
	ready: boolean;
	kind: ContinueAction['kind'] | null;
	unlocked: number;
	hasSession: boolean;
}): boolean {
	if (!args.ready) return true;
	if (args.kind !== 'start') return false;
	return args.unlocked === 0 && !args.hasSession;
}

export interface LiveLabFolio {
	number: number;
	card: number;
	total: number;
}

export function shellFolio(args: {
	pathname: string;
	action: ContinueAction | null;
	liveLab: LiveLabFolio | null;
	queue: number;
	resumeCard: LiveLabFolio | null;
}): { text: string; pip: FolioPip; kind: ContinueAction['kind'] } {
	const onReview = args.pathname.includes('/review');
	if (args.liveLab) {
		const kind = args.action?.kind === 'resume' ? 'resume' : 'start';
		return {
			text: folioText({
				mode: 'lab',
				labNumber: args.liveLab.number,
				card: args.liveLab.card,
				total: args.liveLab.total
			}),
			pip: folioPip(kind),
			kind
		};
	}
	if (onReview) {
		if (args.queue > 0) {
			return { text: folioText({ mode: 'due', queue: args.queue }), pip: 'rose', kind: 'review' };
		}
		return { text: folioText({ mode: 'clear' }), pip: 'good', kind: 'caught-up' };
	}
	const action = args.action;
	if (!action) {
		return { text: folioText({ mode: 'lab', labNumber: 1, card: 1, total: 1 }), pip: 'moss', kind: 'start' };
	}
	switch (action.kind) {
		case 'review':
			return { text: folioText({ mode: 'due', queue: args.queue }), pip: 'rose', kind: 'review' };
		case 'caught-up':
			return { text: folioText({ mode: 'clear' }), pip: 'good', kind: 'caught-up' };
		case 'resume':
			if (args.resumeCard) {
				return {
					text: folioText({
						mode: 'lab',
						labNumber: args.resumeCard.number,
						card: args.resumeCard.card,
						total: args.resumeCard.total
					}),
					pip: 'rose',
					kind: 'resume'
				};
			}
			return { text: action.title, pip: 'rose', kind: 'resume' };
		case 'start': {
			const id = action.href.match(/\/lab\/(\d+)/)?.[1];
			const number = id ? Number(id) : 1;
			const total = args.resumeCard?.total ?? 1;
			return {
				text: folioText({ mode: 'lab', labNumber: number, card: 1, total }),
				pip: 'moss',
				kind: 'start'
			};
		}
		default: {
			const _exhaustive: never = action.kind;
			return _exhaustive;
		}
	}
}
