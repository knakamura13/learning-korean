import type { Handle } from '@sveltejs/kit';
import { activeSystem } from '$lib/theme/active';
import { applyPaperPlaceholders } from '$lib/theme/placeholders';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => applyPaperPlaceholders(html, activeSystem)
	});
};
