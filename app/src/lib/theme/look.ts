import { DEFAULT_LOOK_ID, isLookId, LOOKS, type LookId } from './catalog';

export const LOOK_KEY = 'korean-look';

export function readLookId(): LookId {
	try {
		const value = localStorage.getItem(LOOK_KEY);
		if (isLookId(value)) return value;
	} catch {
		/* file:// or blocked storage */
	}
	return DEFAULT_LOOK_ID;
}

export function writeLookId(id: LookId): boolean {
	try {
		localStorage.setItem(LOOK_KEY, id);
		return true;
	} catch {
		return false;
	}
}

export function paperFor(id: LookId, resolved: 'light' | 'dark'): string {
	const system =
		LOOKS.find((look) => look.id === id) ??
		LOOKS.find((look) => look.id === DEFAULT_LOOK_ID) ??
		LOOKS[0];
	return resolved === 'dark' ? system.dark.paper : system.light.paper;
}
