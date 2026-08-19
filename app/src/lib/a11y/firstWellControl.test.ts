/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { firstWellControl } from './firstWellControl';

afterEach(() => {
	document.body.replaceChildren();
});

function well(html: string): HTMLElement {
	const root = document.createElement('div');
	root.className = 'work';
	root.innerHTML = html;
	document.body.appendChild(root);
	return root;
}

describe('firstWellControl', () => {
	it('returns null when the well is missing or empty', () => {
		expect(firstWellControl(null)).toBeNull();
		expect(firstWellControl(well(''))).toBeNull();
	});

	it('returns the first enabled button in tree order', () => {
		const root = well(`
			<button type="button">lips</button>
			<button type="button">teeth</button>
		`);
		expect(firstWellControl(root)?.textContent).toBe('lips');
	});

	it('skips disabled controls and tabindex="-1" roving radios', () => {
		const root = well(`
			<button type="button" disabled>locked</button>
			<button type="button" tabindex="-1" role="radio">ㄱ</button>
			<button type="button" tabindex="0" role="radio">ㄴ</button>
		`);
		expect(firstWellControl(root)?.textContent).toBe('ㄴ');
	});

	it('skips audio play buttons so a choice card lands on the answer, not the speaker', () => {
		const root = well(`
			<button type="button" class="play" aria-label="Play ㄱ">play</button>
			<button type="button" class="opt">g</button>
		`);
		expect(firstWellControl(root)?.className).toBe('opt');
	});

	it('skips hidden and inert subtrees', () => {
		const root = well(`
			<div aria-hidden="true"><button type="button">ghost</button></div>
			<div hidden><button type="button">hidden</button></div>
			<button type="button">ridge</button>
		`);
		expect(firstWellControl(root)?.textContent).toBe('ridge');
	});
});
