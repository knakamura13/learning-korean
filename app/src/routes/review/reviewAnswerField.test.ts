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

	it('answers block cards by composing the block, not by recognition', () => {
		expect(src).toMatch(/from '\$lib\/components\/ReviewCompose\.svelte'/);
		expect(src).toMatch(/composeTrial\(/);
		expect(src).toMatch(/card\??\.kind === 'block'/);
		expect(src).toMatch(/progress\.answer\(card\.id/);
		expect(src).not.toMatch(/SprintChoices/);
		expect(src).not.toMatch(/answerRound/);
		// The card front inverts: the sound is shown, the spelling is built.
		expect(src).toMatch(/glyph sound/);
		expect(src).toMatch(/build the block that says this/);
	});

	it('wires PlayButton audioSlot from reviewAudioSlot, not a lead-only gate', () => {
		expect(src).toMatch(/audioSlot=\{reviewAudioSlot|reviewAudioSlot\(/);
		expect(src).not.toMatch(/isConsonantLead/);
		expect(src).toMatch(/<PlayButton\b/);
	});

	it('does not render PlayButton for block or pron cards', () => {
		expect(src).toMatch(/case 'block'/);
		expect(src).toMatch(/case 'pron'/);
		expect(src).toMatch(/return null/);
		expect(src).not.toMatch(/card\.kind === 'consonant' \|\| isConsonantLead/);
	});

	it('builds compose trays from the unlocked tiers so distractors stay met', () => {
		expect(src).toMatch(/composeTrial\(current\.front, unlockedTiers, Math\.random\)/);
	});
});
