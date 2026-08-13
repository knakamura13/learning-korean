import { error } from '@sveltejs/kit';
import { LABS, LABS_BY_ID } from '$lib/content';

/** Tells adapter-static which lab pages to prerender. */
export function entries() {
	return LABS.map((lab) => ({ id: lab.id }));
}

export function load({ params }) {
	const lab = LABS_BY_ID[params.id];
	if (!lab) error(404, `No lab ${params.id}`);
	return { lab };
}
