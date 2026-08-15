export type ChoiceKeyScheme = 'digit' | 'letter';

/** True when a 1–9 chip would be the same glyph as an answer, after shuffle. */
function collidesWithDigitShortcut(text: string): boolean {
	const t = text.trim();
	return /^\d+$/.test(t);
}

export function choiceKeyScheme(options: string[]): ChoiceKeyScheme {
	return options.some(collidesWithDigitShortcut) ? 'letter' : 'digit';
}

export function choiceKeyLabel(scheme: ChoiceKeyScheme, index: number): string {
	switch (scheme) {
		case 'digit':
			return String(index + 1);
		case 'letter':
			return String.fromCharCode(65 + index);
		default: {
			const _exhaustive: never = scheme;
			return _exhaustive;
		}
	}
}

export function choiceIndexFromKey(
	scheme: ChoiceKeyScheme,
	key: string,
	count: number
): number | null {
	switch (scheme) {
		case 'digit': {
			if (!/^[1-9]$/.test(key)) return null;
			const n = Number(key);
			if (n < 1 || n > count) return null;
			return n - 1;
		}
		case 'letter': {
			if (key.length !== 1) return null;
			const c = key.toUpperCase();
			if (c < 'A' || c > 'Z') return null;
			const i = c.charCodeAt(0) - 65;
			if (i < 0 || i >= count) return null;
			return i;
		}
		default: {
			const _exhaustive: never = scheme;
			return _exhaustive;
		}
	}
}

export function isChoiceShortcutKey(key: string, options: string[]): boolean {
	return choiceIndexFromKey(choiceKeyScheme(options), key, options.length) !== null;
}
