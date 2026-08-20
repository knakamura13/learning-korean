import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('review answer field', () => {
	it('keeps a visible label associated with the input', () => {
		expect(src).toMatch(/<label[^>]*\bfor="review-answer"/);
		expect(src).toMatch(/id="review-answer"/);
		expect(src).toMatch(/Your answer/);
		expect(src).not.toMatch(/aria-label="your answer"/);
	});

	it('pairs the submit button with the input, not the label', () => {
		expect(src).toMatch(/class="answer-controls"/);
		expect(src).toMatch(/\.answer-controls\s*\{[^}]*align-items:\s*stretch/s);
		expect(src).toMatch(/\.answer-controls \.btn\s*\{[^}]*align-self:\s*stretch/s);
		expect(src).not.toMatch(/align-items:\s*flex-start/);
	});

	it('includes progressbar attributes for session orientation', () => {
		expect(src).toMatch(/role="progressbar"/);
		expect(src).toMatch(/aria-valuenow=\{index \+ 1\}/);
		expect(src).toMatch(/aria-valuemax=\{queue\.length\}/);
	});

	it('still flags empty submit and disables the field after an answer', () => {
		expect(src).toMatch(/aria-invalid=\{emptyHint \? true : undefined\}/);
		expect(src).toMatch(/id="empty-hint"/);
		expect(src).toMatch(/disabled=\{answered\}/);
		expect(src).toMatch(/checkAnswer\(card, value\)/);
	});

	it('caps typed answers and gives the field a hover border', () => {
		expect(src).toMatch(/maxlength=\{REVIEW_ANSWER_MAX_LENGTH\}/);
		expect(src).toMatch(/\.in:hover:not\(:disabled\)\s*\{[^}]*border-color:\s*var\(--accent\)/s);
	});

	it('uses a spoken-form placeholder for pronunciation cards', () => {
		expect(src).toMatch(/reviewAnswerPlaceholder\(card\.kind\)/);
		expect(src).toMatch(/card\?\.kind === 'pron'/);
		expect(src).toMatch(/hyphenated cuts, or Hangul/);
		expect(src).not.toMatch(/type the romanization/);
	});

	it('focuses the answer field without yanking the page', () => {
		expect(src).toMatch(/input\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
	});

	it('stacks the answer field above Check on phones', () => {
		expect(src).toMatch(/@media \(max-width: 36rem\)/);
		expect(src).toMatch(/\.answer-controls \.in,\s*\.answer-controls \.btn \{ flex: 1 1 100%; \}/);
	});

	it('paints alternate answers in solid ink-soft, not opacity', () => {
		expect(src).toMatch(/\.ans em\s*\{[^}]*color:\s*var\(--ink-soft\)/);
		expect(src).not.toMatch(/\.ans em\s*\{[^}]*opacity\s*:/);
	});

	it('answers block cards with SprintChoices, not the typed field', () => {
		expect(src).toMatch(/from '\$lib\/components\/SprintChoices\.svelte'/);
		expect(src).toMatch(/trialForBlock/);
		expect(src).toMatch(/blockInventory/);
		expect(src).toMatch(/card\.kind === 'block'/);
		expect(src).toMatch(/progress\.answer\(card\.id/);
		expect(src).not.toMatch(/answerRound/);
	});
});
