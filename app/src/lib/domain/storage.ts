/**
 * storage.ts — persistence as a port, not a hard dependency.
 *
 * The old app called localStorage inline and swallowed failures, which meant a
 * browser refusing storage on file:// origins would silently discard a month of
 * reviews. Here persistence is an interface: the app injects a real one, tests
 * inject memory, and a future sync backend slots in without touching srs.ts.
 */

export interface Storage {
	read(): string | null;
	write(value: string): void;
	clear(): void;
	/** False when writes will not survive — the UI must say so out loud. */
	readonly durable: boolean;
}

export function memoryStorage(initial: string | null = null): Storage {
	let value = initial;
	return {
		read: () => value,
		write: (v) => { value = v; },
		clear: () => { value = null; },
		durable: false
	};
}

/**
 * Backed by window.localStorage, with an up-front probe. If the probe fails we
 * fall back to memory so the session still works, but report durable: false so
 * the UI can warn instead of pretending everything is saved.
 */
export function browserStorage(key: string): Storage {
	let durable = false;
	try {
		const probe = `${key}::probe`;
		localStorage.setItem(probe, '1');
		localStorage.removeItem(probe);
		durable = true;
	} catch {
		durable = false;
	}

	if (!durable) return { ...memoryStorage(), durable: false };

	return {
		read: () => {
			try { return localStorage.getItem(key); } catch { return null; }
		},
		write: (v) => {
			try { localStorage.setItem(key, v); } catch { /* quota or blocked */ }
		},
		clear: () => {
			try { localStorage.removeItem(key); } catch { /* ignore */ }
		},
		durable: true
	};
}
