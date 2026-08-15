import { describe, expect, it } from 'vitest';
import {
	choiceIndexFromKey,
	choiceKeyLabel,
	choiceKeyScheme,
	isChoiceShortcutKey
} from './choiceKeys';

describe('choiceKeyScheme', () => {
	it('keeps 1–9 for non-numeric sentence options', () => {
		expect(
			choiceKeyScheme([
				'Stops the air and holds it',
				'Lets more air escape after it',
				'Adds a small vowel after it',
				'Repeats the consonant sound twice'
			])
		).toBe('digit');
	});

	it('uses letter keys when every option is a digit', () => {
		expect(choiceKeyScheme(['1', '2', '3', '4'])).toBe('letter');
		expect(choiceKeyScheme(['5', '6', '7', '9'])).toBe('letter');
	});
});

describe('numeric options must not collide with digit shortcuts', () => {
	/**
	 * After shuffle, visible order is not authored order. A chip labelled `2`
	 * on the option `4` is what learners press — they mean the answer they see.
	 */
	it('cannot expose a digit shortcut equal to a different option’s value', () => {
		const visible = ['4', '1', '3', '2'];
		const scheme = choiceKeyScheme(visible);

		for (const value of visible) {
			if (!/^[1-9]$/.test(value)) continue;
			const idx = choiceIndexFromKey(scheme, value, visible.length);
			if (idx === null) continue;
			expect(visible[idx], `key ${value} selected a different option`).toBe(value);
		}

		// Digit scheme would map key 2 → index 1, whose text is `1`, not `2`.
		expect(choiceIndexFromKey(scheme, '2', visible.length)).toBeNull();
		expect(choiceIndexFromKey(scheme, '4', visible.length)).toBeNull();
	});

	it('does the same for counts that are not 1–4', () => {
		const visible = ['9', '5', '7', '6'];
		const scheme = choiceKeyScheme(visible);
		for (const value of visible) {
			const idx = choiceIndexFromKey(scheme, value, visible.length);
			if (idx !== null) expect(visible[idx]).toBe(value);
		}
		expect(choiceIndexFromKey(scheme, '5', visible.length)).toBeNull();
	});
});

describe('choiceIndexFromKey / chrome', () => {
	it('maps 1–9 to visible order for sentence options', () => {
		const options = ['Where', 'When', 'Why', 'How'];
		expect(choiceIndexFromKey(choiceKeyScheme(options), '1', 4)).toBe(0);
		expect(choiceIndexFromKey(choiceKeyScheme(options), '2', 4)).toBe(1);
		expect(choiceIndexFromKey(choiceKeyScheme(options), 'a', 4)).toBeNull();
		expect(choiceKeyLabel('digit', 0)).toBe('1');
		expect(choiceKeyLabel('digit', 3)).toBe('4');
		expect(isChoiceShortcutKey('2', options)).toBe(true);
		expect(isChoiceShortcutKey('a', options)).toBe(false);
	});

	it('maps A–D shift-independently for numeric options', () => {
		const options = ['1', '2', '3', '4'];
		expect(choiceIndexFromKey('letter', 'a', 4)).toBe(0);
		expect(choiceIndexFromKey('letter', 'B', 4)).toBe(1);
		expect(choiceIndexFromKey('letter', 'd', 4)).toBe(3);
		expect(choiceIndexFromKey('letter', 'e', 4)).toBeNull();
		expect(choiceKeyLabel('letter', 0)).toBe('A');
		expect(choiceKeyLabel('letter', 3)).toBe('D');
		expect(isChoiceShortcutKey('b', options)).toBe(true);
		expect(isChoiceShortcutKey('2', options)).toBe(false);
	});

	it('ignores keys past the option count', () => {
		expect(choiceIndexFromKey('digit', '5', 4)).toBeNull();
		expect(choiceIndexFromKey('letter', 'e', 4)).toBeNull();
	});
});

describe('Options chrome stays in lockstep with the scheme', () => {
	it('labels keys via choiceKeyLabel, not position digits alone', async () => {
		const src = await import('../components/Options.svelte?raw');
		expect(src.default).toContain('choiceKeyLabel(keyScheme, i)');
		expect(src.default).not.toMatch(/<span class="key">\{i \+ 1\}<\/span>/);
	});
});
