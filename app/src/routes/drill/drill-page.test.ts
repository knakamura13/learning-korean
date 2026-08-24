import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('drill page source contracts', () => {
	it('titles Block sprint without a Timed drill eyebrow', () => {
		expect(src).toMatch(/Block sprint/);
		expect(src).not.toMatch(/Timed drill/);
		expect(src).not.toMatch(/class="eyebrow"/);
	});

	it('uses the sprint domain and does not write the Review schedule', () => {
		expect(src).toMatch(/sprintEligible/);
		expect(src).toMatch(/sprintMissingLab/);
		expect(src).toMatch(/startRound/);
		expect(src).toMatch(/tickRound/);
		expect(src).toMatch(/answerRound/);
		expect(src).toMatch(/sprintScore/);
		expect(src).not.toMatch(/progress\.answer/);
		expect(src).not.toMatch(/grade\(/);
	});

	it('renders SprintChoices, a Hangul glyph, and a timer', () => {
		expect(src).toMatch(/SprintChoices/);
		expect(src).toMatch(/lang="ko"/);
		expect(src).toMatch(/role="timer"/);
	});

	it('announces verdicts, prompt advances, and round end from one polite region; timer stays off', () => {
		expect(src).toMatch(/data-drill-live[^>]*aria-live="polite"/);
		expect(src).toMatch(/data-drill-live[^>]*aria-atomic="true"/);
		expect(src).toMatch(/role="timer"[^>]*aria-live="off"/);
		expect(src).not.toMatch(/role="timer"[^>]*aria-live="polite"/);
	});

	it('has idle and done copy', () => {
		expect(src).toMatch(/Start 60-second round/);
		expect(src).toMatch(/Another round/);
		expect(src).toMatch(/median/);
	});

	it('lets the learner end a running round without waiting out the timer', () => {
		expect(src).toMatch(/endRound/);
		expect(src).toMatch(/>End round</);
	});

	it('gates the clock on a running $state flag', () => {
		expect(src).toMatch(/let running = \$state\(false\)/);
		expect(src).toMatch(/\$effect\(\(\) => \{/);
		expect(src).toMatch(/\$effect\(\(\) => \{\s*if \(!running\) return;/);
	});
});
