/**
 * storage.ts — persistence as a port, not a hard dependency.
 *
 * The old app called localStorage inline and swallowed failures, which meant a
 * browser refusing storage on file:// origins would silently discard a month of
 * reviews. Here persistence is an interface: the app injects a real one, tests
 * inject memory, and a future sync backend slots in without touching srs.ts.
 *
 * `write` returns whether this adapter stored the value. `durable` is whether
 * that value will survive a reload — a later quota error flips it to false so
 * the UI cannot keep claiming history is saved.
 */

export interface Storage {
	read(): string | null;
	/** True when this adapter now holds `value`. */
	write(value: string): boolean;
	clear(): void;
	/** False when writes will not survive — the UI must say so out loud. */
	readonly durable: boolean;
}

export function memoryStorage(initial: string | null = null): Storage {
	let value = initial;
	return {
		read: () => value,
		write: (v) => {
			value = v;
			return true;
		},
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
			try {
				localStorage.setItem(key, v);
				return true;
			} catch {
				durable = false;
				return false;
			}
		},
		clear: () => {
			try { localStorage.removeItem(key); } catch { /* ignore */ }
		},
		get durable() {
			return durable;
		}
	};
}

/** Other tabs fire `storage`; this window does not. `key === null` is a full clear. */
export function onStorageKey(key: string, handler: (value: string | null) => void): () => void {
	if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
		return () => {};
	}
	const listener = (event: StorageEvent) => {
		if (event.storageArea && event.storageArea !== localStorage) return;
		if (event.key !== key && event.key !== null) return;
		handler(event.key === null ? null : event.newValue);
	};
	window.addEventListener('storage', listener);
	return () => window.removeEventListener('storage', listener);
}
