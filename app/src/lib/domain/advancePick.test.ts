import { describe, it, expect } from 'vitest';
import { settleAdvancePick } from './advancePick';

describe('settleAdvancePick', () => {
	it('treats a correct pick as a yes with no override copy', () => {
		expect(settleAdvancePick(true, { teach: 'that is pizza', miss: 'not pasta' })).toEqual({
			correct: true
		});
	});

	it('treats a wrong pick as not-quite and uses the miss copy', () => {
		expect(settleAdvancePick(false, { teach: 'that is pizza', miss: 'not pasta' })).toEqual({
			overrideTeach: 'not pasta',
			correct: false
		});
	});

	it('falls back to the teach copy when a wrong pick has no miss', () => {
		expect(settleAdvancePick(false, { teach: 'that is pizza' })).toEqual({
			overrideTeach: 'that is pizza',
			correct: false
		});
	});
});
