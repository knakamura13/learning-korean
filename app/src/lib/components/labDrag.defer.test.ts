// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushLabDrag, labDrag } from './labDrag';

describe('labDrag deferral', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.unstubAllGlobals();
	});

	it('schedules Shopify bind on idle instead of importing on attach', () => {
		const idle = vi.fn(() => 1);
		vi.stubGlobal('requestIdleCallback', idle);
		vi.stubGlobal('cancelIdleCallback', vi.fn());

		const node = document.createElement('div');
		document.body.append(node);
		const destroy = labDrag({ draggable: '.chip' })(node);

		expect(idle).toHaveBeenCalledTimes(1);
		destroy();
	});

	it('flushLabDrag loads Shopify without waiting for idle', async () => {
		const idle = vi.fn(() => 1);
		vi.stubGlobal('requestIdleCallback', idle);
		vi.stubGlobal('cancelIdleCallback', vi.fn());

		const node = document.createElement('div');
		document.body.append(node);
		const destroy = labDrag({ draggable: '.chip' })(node);

		const add = vi.spyOn(window, 'addEventListener');
		await flushLabDrag();
		expect(add).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.anything());
		add.mockRestore();
		destroy();
	});
});
