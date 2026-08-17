import type { Handle } from '@sveltejs/kit';
import { activeSystem } from '$lib/theme/active';
import { applyDesignSystem } from '$lib/theme/placeholders';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => applyDesignSystem(html, activeSystem)
	});
};
