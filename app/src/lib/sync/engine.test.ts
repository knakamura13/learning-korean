import { afterEach, describe, expect, it, vi } from 'vitest';
import { canonicalJson, createSyncEngine } from './engine';

afterEach(() => {
	vi.useRealTimers();
});

type PutResult =
	| { kind: 'ok'; data: { rev: number } }
	| { kind: 'conflict'; rev: number; doc: unknown }
	| { kind: 'unauthorized' }
	| { kind: 'unavailable' };

/** Scriptable fake server: queue of put results, fixed get result. */
function harness(opts: {
	get?: { kind: 'ok'; data: { rev: number; doc: unknown } } | { kind: 'unavailable' } | { kind: 'unauthorized' };
	puts?: PutResult[];
	doc?: unknown | null;
}) {
	const putCalls: { baseRev: number; doc: unknown }[] = [];
	const applied: unknown[] = [];
	let authLost = 0;
	let doc: unknown | null = opts.doc === undefined ? { n: 1 } : opts.doc;
	const puts = opts.puts ?? [];

	const engine = createSyncEngine({
		api: {
			getState: async () => (opts.get ?? { kind: 'ok', data: { rev: 0, doc: null } }) as never,
			putState: async (baseRev: number, body: unknown) => {
				putCalls.push({ baseRev, doc: body });
				return (puts.shift() ?? { kind: 'ok', data: { rev: baseRev + 1 } }) as never;
			}
		},
		buildDoc: () => doc,
		applyRemote: (d) => {
			applied.push(d);
		},
		onAuthLost: () => {
			authLost++;
		},
		debounceMs: 10
	});

	return {
		engine,
		putCalls,
		applied,
		get authLost() {
			return authLost;
		},
		setDoc(d: unknown | null) {
			doc = d;
		}
	};
}

describe('canonicalJson', () => {
	it('ignores key order so jsonb round-trips compare equal', () => {
		expect(canonicalJson({ b: 1, a: { d: [1, 2], c: 'x' } })).toBe(
			canonicalJson({ a: { c: 'x', d: [1, 2] }, b: 1 })
		);
		expect(canonicalJson({ a: 1 })).not.toBe(canonicalJson({ a: 2 }));
		expect(canonicalJson(null)).toBe('null');
	});
});

describe('sync engine', () => {
	it('adopts the local document on first sign-in (rev 0)', async () => {
		const h = harness({ get: { kind: 'ok', data: { rev: 0, doc: null } } });
		await h.engine.start();
		expect(h.putCalls).toEqual([{ baseRev: 0, doc: { n: 1 } }]);
		expect(h.engine.rev).toBe(1);
		expect(h.applied).toEqual([]);
	});

	it('merges the server copy in and skips the push when nothing differs', async () => {
		const h = harness({ get: { kind: 'ok', data: { rev: 4, doc: { n: 1 } } }, doc: { n: 1 } });
		await h.engine.start();
		expect(h.applied).toEqual([{ n: 1 }]);
		expect(h.putCalls).toEqual([]);
		expect(h.engine.rev).toBe(4);
	});

	it('pushes back after a pull when the merge produced something new', async () => {
		const h = harness({ get: { kind: 'ok', data: { rev: 4, doc: { n: 1 } } }, doc: { n: 2 } });
		await h.engine.start();
		expect(h.putCalls).toEqual([{ baseRev: 4, doc: { n: 2 } }]);
		expect(h.engine.rev).toBe(5);
	});

	it('debounces local changes into one push', async () => {
		vi.useFakeTimers();
		const h = harness({ get: { kind: 'ok', data: { rev: 0, doc: null } }, doc: { n: 1 } });
		await h.engine.start();
		h.setDoc({ n: 2 });
		h.engine.onLocalChange();
		h.engine.onLocalChange();
		h.engine.onLocalChange();
		await vi.advanceTimersByTimeAsync(20);
		expect(h.putCalls.length).toBe(2); // adoption + one debounced push
		expect(h.putCalls[1]).toEqual({ baseRev: 1, doc: { n: 2 } });
	});

	it('converges through a 409 by merging the winner and pushing once more', async () => {
		const h = harness({
			get: { kind: 'ok', data: { rev: 0, doc: null } },
			doc: { n: 2 },
			puts: [{ kind: 'conflict', rev: 7, doc: { n: 9 } }, { kind: 'ok', data: { rev: 8 } }]
		});
		await h.engine.start();
		// First put lost; server copy {n:9} was applied locally; the merged doc
		// (still {n:2} in this fake) re-pushed against rev 7.
		expect(h.applied).toEqual([{ n: 9 }]);
		expect(h.putCalls.map((c) => c.baseRev)).toEqual([0, 7]);
		expect(h.engine.rev).toBe(8);
	});

	it('goes inert while the local document is quarantined', async () => {
		const h = harness({ get: { kind: 'ok', data: { rev: 0, doc: null } }, doc: null });
		await h.engine.start();
		expect(h.putCalls).toEqual([]);
	});

	it('reports a lost session exactly once per response', async () => {
		const h = harness({ get: { kind: 'unauthorized' } });
		await h.engine.start();
		expect(h.authLost).toBe(1);
		expect(h.putCalls).toEqual([]);
	});

	it('stays quiet when the backend is unavailable', async () => {
		const h = harness({ get: { kind: 'unavailable' } });
		await h.engine.start();
		expect(h.putCalls).toEqual([]);
		expect(h.authLost).toBe(0);
	});

	it('flush fires only when the document moved since the last push', async () => {
		const h = harness({ get: { kind: 'ok', data: { rev: 0, doc: null } }, doc: { n: 1 } });
		await h.engine.start();
		const fired: unknown[] = [];
		h.engine.flush((baseRev, doc) => fired.push({ baseRev, doc }));
		expect(fired).toEqual([]);
		h.setDoc({ n: 3 });
		h.engine.flush((baseRev, doc) => fired.push({ baseRev, doc }));
		expect(fired).toEqual([{ baseRev: 1, doc: { n: 3 } }]);
	});

	it('does nothing after stop', async () => {
		vi.useFakeTimers();
		const h = harness({ get: { kind: 'ok', data: { rev: 0, doc: null } } });
		await h.engine.start();
		h.engine.stop();
		h.setDoc({ n: 5 });
		h.engine.onLocalChange();
		await vi.advanceTimersByTimeAsync(50);
		expect(h.putCalls.length).toBe(1);
	});
});
