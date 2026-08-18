import { describe, it, expect } from 'vitest';
import { CHOICE_RETRY_COPY, resolveChoicePick } from './advancePick';

describe('resolveChoicePick', () => {
	it('settles a correct pick without override copy', () => {
		expect(resolveChoicePick(true, { teach: 'that is pizza', miss: 'not pasta' })).toEqual({
			action: 'settle',
			correct: true
		});
	});

	it('nudges a wrong pick with the miss copy and does not settle', () => {
		expect(resolveChoicePick(false, { teach: 'that is pizza', miss: 'not pasta' })).toEqual({
			action: 'nudge',
			html: 'not pasta'
		});
	});

	it('does not reveal the teach copy when a wrong pick has no miss', () => {
		expect(resolveChoicePick(false, { teach: 'that is pizza' })).toEqual({
			action: 'nudge',
			html: CHOICE_RETRY_COPY
		});
		expect(CHOICE_RETRY_COPY).not.toContain('pizza');
	});
});
