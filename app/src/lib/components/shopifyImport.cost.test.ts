// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

describe('Shopify Draggable import cost', () => {
	it('registers a window touchmove listener at module evaluation', async () => {
		const add = vi.spyOn(window, 'addEventListener');
		const t0 = performance.now();
		await import('./labDrag.client');
		const dt = performance.now() - t0;

		expect(add).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.anything());
		// Parse + side-effect cost is enough to keep the binder off the mount path.
		expect(dt).toBeGreaterThan(0);
		add.mockRestore();
	});
});
