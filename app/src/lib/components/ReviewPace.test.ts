/**
 * @vitest-environment jsdom
 */
import { mount, unmount, flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ReviewPace from './ReviewPace.svelte';
import { session } from '$lib/stores/session.svelte';

let host: HTMLElement;

beforeEach(() => {
	host = document.createElement('div');
	document.body.appendChild(host);
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('ReviewPace', () => {
	it('does not render when session is not signed-in', () => {
		const app = mount(ReviewPace, { target: host });
		flushSync();
		expect(host.querySelector('#review-pace')).toBeNull();
		unmount(app);
	});

	it('renders inputs with aria-describedby hint references when signed-in', async () => {
		// Mock session as signed-in
		const origStatus = session.status;
		Object.defineProperty(session, 'status', { value: 'signed-in', configurable: true });

		const app = mount(ReviewPace, { target: host });
		flushSync();

		const section = host.querySelector('#review-pace');
		expect(section).not.toBeNull();

		const newCardsInput = host.querySelector<HTMLInputElement>('input[aria-describedby="new-cards-hint"]');
		expect(newCardsInput).not.toBeNull();
		const newCardsHint = host.querySelector('#new-cards-hint');
		expect(newCardsHint?.textContent).toBe('0–50 cards');

		const reviewsInput = host.querySelector<HTMLInputElement>('input[aria-describedby="reviews-sitting-hint"]');
		expect(reviewsInput).not.toBeNull();
		const reviewsHint = host.querySelector('#reviews-sitting-hint');
		expect(reviewsHint?.textContent).toBe('1–100 reviews');

		const submitBtn = host.querySelector<HTMLButtonElement>('button[type="submit"]');
		expect(submitBtn?.textContent?.trim()).toBe('Save study pace');

		unmount(app);
		Object.defineProperty(session, 'status', { value: origStatus, configurable: true });
	});
});
