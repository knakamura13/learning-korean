import type { Handle } from '@sveltejs/kit';
import { activeSystem } from '$lib/theme/active';
import { LOOKS } from '$lib/theme/catalog';
import { applyDesignSystem } from '$lib/theme/placeholders';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => applyDesignSystem(html, LOOKS, activeSystem)
	});
};
